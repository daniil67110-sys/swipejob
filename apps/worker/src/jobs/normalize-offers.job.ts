import { eq, isNull, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { offers, offerSources } from '@swipejob/db/schema';
import { normalizeOffer } from '../lib/normalize.js';
import { getOfferDedupeQueue } from '../queues/index.js';
import logger from '../lib/logger.js';

const BATCH_SIZE = 500;

export type NormalizeResult =
  | { ok: true; count: number; durationMs: number }
  | { ok: false; error: string };

/**
 * Batch normalize les offres avec `normalized_at IS NULL`.
 *
 * Pour chaque offre :
 * - calcule qualityScore (heuristiques V1)
 * - extrait sourceUrl depuis rawPayload + source name
 * - extrait contactEmail depuis description
 * - extrait publishedAt depuis rawPayload
 *
 * Idempotent : `normalized_at IS NULL` filter → safe à enqueue plusieurs fois.
 * Le batch traite max BATCH_SIZE offres / appel pour éviter timeouts longs.
 */
export async function processNormalizeOffers(): Promise<NormalizeResult> {
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  const start = Date.now();
  try {
    const rows = await db
      .select({
        id: offers.id,
        sourceId: offers.sourceId,
        externalId: offers.externalId,
        title: offers.title,
        description: offers.description,
        companyName: offers.companyName,
        locationCity: offers.locationCity,
        locationLat: offers.locationLat,
        locationLng: offers.locationLng,
        salaryMinMonthly: offers.salaryMinMonthly,
        salaryMaxMonthly: offers.salaryMaxMonthly,
        contractType: offers.contractType,
        rawPayload: offers.rawPayload,
        sourceName: offerSources.name,
      })
      .from(offers)
      .innerJoin(offerSources, eq(offers.sourceId, offerSources.id))
      .where(isNull(offers.normalizedAt))
      .limit(BATCH_SIZE);

    if (rows.length === 0) {
      logger.info('No offers to normalize');
      return { ok: true, count: 0, durationMs: Date.now() - start };
    }

    let normalized = 0;
    for (const row of rows) {
      const result = normalizeOffer(
        {
          title: row.title,
          description: row.description,
          companyName: row.companyName,
          locationCity: row.locationCity,
          locationLat: row.locationLat,
          locationLng: row.locationLng,
          salaryMinMonthly: row.salaryMinMonthly,
          salaryMaxMonthly: row.salaryMaxMonthly,
          contractType: row.contractType,
          externalId: row.externalId,
          rawPayload: row.rawPayload,
        },
        row.sourceName,
      );

      await db
        .update(offers)
        .set({
          qualityScore: result.qualityScore,
          sourceUrl: result.sourceUrl,
          contactEmail: result.contactEmail,
          publishedAt: result.publishedAt,
          normalizedAt: new Date(),
        })
        .where(eq(offers.id, row.id));
      normalized++;
    }

    const durationMs = Date.now() - start;

    // Quality distribution pour observabilité
    const distRows = await db
      .select({
        bucket: sql<string>`width_bucket(quality_score, 0, 1, 5)`.as('bucket'),
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(offers)
      .groupBy(sql`bucket`)
      .catch(() => [] as Array<{ bucket: string; count: number }>);

    logger.info(
      { normalized, durationMs, qualityDistribution: distRows },
      'Normalize batch complete',
    );

    // Trigger dedupe batch (Story 2.5) — idempotent via deduped_at IS NULL.
    if (normalized > 0) {
      const dedupeQueue = getOfferDedupeQueue();
      if (dedupeQueue) {
        await dedupeQueue.add('dedupe', {}).catch((err) => {
          logger.warn({ err }, 'Failed to enqueue dedupe batch post-normalize');
        });
      }
    }

    return { ok: true, count: normalized, durationMs };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'Normalize offers failed');
    return { ok: false, error: errMessage };
  }
}
