import * as Sentry from '@sentry/node';
import { eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { offerSources, offers, type NewOffer } from '@swipejob/db/schema';
import { isFranceTravailConfigured } from '../lib/env.js';
import logger from '../lib/logger.js';
import {
  fetchFranceTravailOffers,
  type FranceTravailOfferRaw,
} from '../scrapers/france-travail/client.js';
import { mapFranceTravailToOffer } from '../scrapers/france-travail/mapper.js';

const SOURCE_NAME = 'france-travail';
const PAGE_SIZE = 150; // limite API France Travail
const MAX_OFFERS_PER_RUN = 5000;
const STALE_THRESHOLD_MS = 15 * 60 * 1000; // NFR-I1 : alerte si pas de succès depuis 15 min

export type IngestResult =
  | {
      ok: true;
      count: number;
      mock?: false;
      durationMs: number;
    }
  | {
      ok: true;
      count: 0;
      mock: true;
    }
  | {
      ok: false;
      error: string;
    };

let lastSuccessAt: number | null = null;

async function getOrCreateSource(): Promise<string> {
  const rows = await db
    .select({ id: offerSources.id, lastSyncAt: offerSources.lastSyncAt })
    .from(offerSources)
    .where(eq(offerSources.name, SOURCE_NAME))
    .limit(1);
  if (rows[0]) return rows[0].id;
  const inserted = await db
    .insert(offerSources)
    .values({
      name: SOURCE_NAME,
      apiUrl: 'https://api.francetravail.io/partenaire/offresdemploi/v2',
    })
    .returning({ id: offerSources.id });
  const row = inserted[0];
  if (!row) throw new Error('Failed to create france-travail source row');
  return row.id;
}

async function fetchAllPages(
  typeContrat: 'E2' | 'MIS',
  publieeDepuisDays: number,
): Promise<FranceTravailOfferRaw[]> {
  const all: FranceTravailOfferRaw[] = [];
  let rangeStart = 0;
  while (all.length < MAX_OFFERS_PER_RUN) {
    const rangeEnd = rangeStart + PAGE_SIZE - 1;
    const page = await fetchFranceTravailOffers({
      typeContrat,
      publieeDepuisDays,
      rangeStart,
      rangeEnd,
    });
    all.push(...page.offers);
    if (!page.hasMore || page.offers.length === 0) break;
    rangeStart = rangeEnd + 1;
  }
  return all;
}

export async function processIngestFranceTravail(): Promise<IngestResult> {
  if (!isFranceTravailConfigured) {
    logger.warn('France Travail not configured — ingest mock (count=0)');
    return { ok: true, count: 0, mock: true };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  const start = Date.now();
  try {
    const sourceId = await getOrCreateSource();

    const [apprentissage, stages] = await Promise.all([
      fetchAllPages('E2', 30),
      fetchAllPages('MIS', 30),
    ]);

    const allRaw = [...apprentissage, ...stages];
    logger.info(
      { fetched: allRaw.length, alternance: apprentissage.length, stage: stages.length },
      'France Travail fetch complete',
    );

    // Map + filter (skip ce qui n'est ni stage ni alternance valide)
    const mapped: NewOffer[] = [];
    for (const raw of allRaw) {
      const m = mapFranceTravailToOffer(raw, sourceId);
      if (m) mapped.push(m);
    }

    // Insert par batchs de 100 (limite params Postgres). V1 : ON CONFLICT DO NOTHING
    // — les offres déjà ingérées (même sourceId+externalId) ne sont pas mises à jour.
    // V2 : ON CONFLICT DO UPDATE pour refresh description/salary/expiresAt si change.
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < mapped.length; i += BATCH) {
      const batch = mapped.slice(i, i + BATCH);
      const res = await db.insert(offers).values(batch).onConflictDoNothing().returning({
        id: offers.id,
      });
      inserted += res.length;
    }

    await db
      .update(offerSources)
      .set({ lastSyncAt: new Date() })
      .where(eq(offerSources.id, sourceId));

    lastSuccessAt = Date.now();
    const durationMs = Date.now() - start;
    logger.info({ inserted, durationMs, sourceId }, 'France Travail ingest complete');
    return { ok: true, count: inserted, durationMs };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'France Travail ingest failed');

    // NFR-I1 : alert Sentry si pas de succès depuis >15 min
    const sinceLastSuccess = lastSuccessAt ? Date.now() - lastSuccessAt : Number.POSITIVE_INFINITY;
    Sentry.captureException(err, {
      tags: { scraper: 'france-travail' },
      level: sinceLastSuccess > STALE_THRESHOLD_MS ? 'error' : 'warning',
      extra: { sinceLastSuccessMs: sinceLastSuccess },
    });
    return { ok: false, error: errMessage };
  }
}

export function getLastSuccessAt(): number | null {
  return lastSuccessAt;
}
