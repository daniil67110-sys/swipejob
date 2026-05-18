import * as Sentry from '@sentry/node';
import { eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { offerSources, offers, type NewOffer } from '@swipejob/db/schema';
import { isAdzunaConfigured } from '../lib/env.js';
import logger from '../lib/logger.js';
import { getOfferNormalizeQueue } from '../queues/index.js';
import { fetchAdzunaOffers, type AdzunaOfferRaw } from '../scrapers/adzuna/client.js';
import { mapAdzunaToOffer } from '../scrapers/adzuna/mapper.js';

const SOURCE_NAME = 'adzuna';
const PAGE_SIZE = 50;
const MAX_PAGES_PER_RUN = 100; // 5000 offres total
const STALE_THRESHOLD_MS = 15 * 60 * 1000;

export type IngestResult =
  | { ok: true; count: number; mock?: false; durationMs: number }
  | { ok: true; count: 0; mock: true }
  | { ok: false; error: string };

let lastSuccessAt: number | null = null;

async function getOrCreateSource(): Promise<string> {
  const rows = await db
    .select({ id: offerSources.id })
    .from(offerSources)
    .where(eq(offerSources.name, SOURCE_NAME))
    .limit(1);
  if (rows[0]) return rows[0].id;
  const inserted = await db
    .insert(offerSources)
    .values({ name: SOURCE_NAME, apiUrl: 'https://api.adzuna.com/v1/api/jobs/fr' })
    .returning({ id: offerSources.id });
  const row = inserted[0];
  if (!row) throw new Error('Failed to create adzuna source row');
  return row.id;
}

async function fetchAllForKeyword(what: string): Promise<AdzunaOfferRaw[]> {
  const all: AdzunaOfferRaw[] = [];
  for (let page = 1; page <= MAX_PAGES_PER_RUN; page++) {
    const result = await fetchAdzunaOffers({ what, page, resultsPerPage: PAGE_SIZE });
    if (result.offers.length === 0) break;
    all.push(...result.offers);
    if (result.offers.length < PAGE_SIZE) break;
  }
  return all;
}

export async function processIngestAdzuna(): Promise<IngestResult> {
  if (!isAdzunaConfigured) {
    logger.warn('Adzuna not configured — ingest mock (count=0)');
    return { ok: true, count: 0, mock: true };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  const start = Date.now();
  try {
    const sourceId = await getOrCreateSource();

    // 2 recherches mots-clés FR : "stage" + "alternance" (Adzuna full-text)
    const [stageOffers, alternanceOffers] = await Promise.all([
      fetchAllForKeyword('stage'),
      fetchAllForKeyword('alternance'),
    ]);

    // Dedup côté in-memory par id Adzuna avant insert (le même item peut
    // matcher les 2 mots-clés via description).
    const seen = new Set<string>();
    const allRaw: AdzunaOfferRaw[] = [];
    for (const raw of [...stageOffers, ...alternanceOffers]) {
      if (raw.id && !seen.has(raw.id)) {
        seen.add(raw.id);
        allRaw.push(raw);
      }
    }

    logger.info(
      { fetched: allRaw.length, stage: stageOffers.length, alternance: alternanceOffers.length },
      'Adzuna fetch complete',
    );

    const mapped: NewOffer[] = [];
    for (const raw of allRaw) {
      const m = mapAdzunaToOffer(raw, sourceId);
      if (m) mapped.push(m);
    }

    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < mapped.length; i += BATCH) {
      const batch = mapped.slice(i, i + BATCH);
      const res = await db
        .insert(offers)
        .values(batch)
        .onConflictDoNothing()
        .returning({ id: offers.id });
      inserted += res.length;
    }

    await db
      .update(offerSources)
      .set({ lastSyncAt: new Date() })
      .where(eq(offerSources.id, sourceId));

    // Trigger normalize batch (Story 2.4) — idempotent via normalized_at IS NULL.
    if (inserted > 0) {
      const normalizeQueue = getOfferNormalizeQueue();
      if (normalizeQueue) {
        await normalizeQueue.add('normalize', {}).catch((err) => {
          logger.warn({ err }, 'Failed to enqueue normalize batch post-ingest');
        });
      }
    }

    lastSuccessAt = Date.now();
    const durationMs = Date.now() - start;
    logger.info({ inserted, durationMs, sourceId }, 'Adzuna ingest complete');
    return { ok: true, count: inserted, durationMs };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'Adzuna ingest failed');

    const sinceLastSuccess = lastSuccessAt ? Date.now() - lastSuccessAt : Number.POSITIVE_INFINITY;
    Sentry.captureException(err, {
      tags: { scraper: 'adzuna' },
      level: sinceLastSuccess > STALE_THRESHOLD_MS ? 'error' : 'warning',
      extra: { sinceLastSuccessMs: sinceLastSuccess },
    });
    return { ok: false, error: errMessage };
  }
}
