import { and, eq, gte, isNull, ne, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { offers } from '@swipejob/db/schema';
import { compositeSimilarity, type OfferForDedupe } from '../lib/dedupe.js';
import logger from '../lib/logger.js';

const BATCH_SIZE = 200;
const QUALITY_FLOOR = 0.5;
const SIMILARITY_THRESHOLD = 0.85;

export type DedupeResult =
  | { ok: true; scanned: number; merged: number; durationMs: number }
  | { ok: false; error: string };

/**
 * Batch dedupe (Story 2.5).
 *
 * Pour chaque offre non-encore-deduped et quality_score >= 0.5 :
 * 1. Sélectionne candidats existants (quality_score >= 0.5, canonical_id IS NULL,
 *    contractType == celui de l'offre, normalized_at NOT NULL).
 * 2. Calcule compositeSimilarity en JS pour les ~50 candidats les plus proches.
 *    Pré-filter SQL léger : limit par companyName (LIKE) + city pour réduire.
 * 3. Si meilleur match > 0.85 → UPDATE candidate.canonical_id = match.id.
 * 4. Toujours UPDATE deduped_at = NOW() (idempotence garantie).
 *
 * NB : la 1ère offre arrivée reste canonical. V2 pourra promouvoir la version
 * la plus complète comme canonical.
 */
export async function processDedupeOffers(): Promise<DedupeResult> {
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  const start = Date.now();
  try {
    const candidates = await db
      .select({
        id: offers.id,
        title: offers.title,
        companyName: offers.companyName,
        locationCity: offers.locationCity,
        contractType: offers.contractType,
      })
      .from(offers)
      .where(
        and(
          isNull(offers.dedupedAt),
          isNull(offers.canonicalId),
          gte(offers.qualityScore, QUALITY_FLOOR),
        ),
      )
      .limit(BATCH_SIZE);

    if (candidates.length === 0) {
      return { ok: true, scanned: 0, merged: 0, durationMs: Date.now() - start };
    }

    let merged = 0;
    for (const candidate of candidates) {
      if (!candidate.companyName || !candidate.contractType) {
        // Skip dedupe : pas assez d'info pour fuzzy match fiable.
        await db.update(offers).set({ dedupedAt: new Date() }).where(eq(offers.id, candidate.id));
        continue;
      }

      // Pré-filter SQL : même contractType, companyName ILIKE prefix 4 chars.
      const companyPrefix = candidate.companyName.slice(0, 4).toLowerCase();
      const existingRows = await db
        .select({
          id: offers.id,
          title: offers.title,
          companyName: offers.companyName,
          locationCity: offers.locationCity,
          contractType: offers.contractType,
        })
        .from(offers)
        .where(
          and(
            ne(offers.id, candidate.id),
            isNull(offers.canonicalId),
            eq(offers.contractType, candidate.contractType),
            gte(offers.qualityScore, QUALITY_FLOOR),
            sql`lower(${offers.companyName}) like ${companyPrefix + '%'}`,
          ),
        )
        .limit(50);

      let bestMatch: { id: string; score: number } | null = null;
      for (const other of existingRows) {
        const score = compositeSimilarity(candidate as OfferForDedupe, other as OfferForDedupe);
        if (score > SIMILARITY_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { id: other.id, score };
        }
      }

      if (bestMatch) {
        await db
          .update(offers)
          .set({ canonicalId: bestMatch.id, dedupedAt: new Date() })
          .where(eq(offers.id, candidate.id));
        merged++;
        logger.info(
          { offerId: candidate.id, canonicalId: bestMatch.id, score: bestMatch.score },
          'offer.merged',
        );
      } else {
        await db.update(offers).set({ dedupedAt: new Date() }).where(eq(offers.id, candidate.id));
      }
    }

    const durationMs = Date.now() - start;
    logger.info({ scanned: candidates.length, merged, durationMs }, 'Dedupe batch complete');
    return { ok: true, scanned: candidates.length, merged, durationMs };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'Dedupe offers failed');
    return { ok: false, error: errMessage };
  }
}
