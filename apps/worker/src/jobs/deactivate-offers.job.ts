import { sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import logger from '../lib/logger.js';

export type DeactivateResult =
  | { ok: true; expired: number; archived: number; durationMs: number }
  | { ok: false; error: string };

/**
 * Story 2.6 — désactivation auto.
 *
 * Étape 1 : `expires_at < NOW()` ET `status = 'active'` → `expired` + `is_active=false`.
 * Étape 2 : `status = 'expired'` ET `updated_at < NOW() - 90j` → `archived`
 *           avec PII réduite (description NULL, raw_payload NULL) pour NFR-S3.
 *
 * Cron quotidien 03h UTC (heure creuse).
 */
export async function processDeactivateOffers(): Promise<DeactivateResult> {
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  const start = Date.now();
  try {
    // Étape 1 : expirer les offres dont expires_at est passé.
    const expiredRes = await db.execute(sql<{ id: string }>`
      UPDATE offers
      SET status = 'expired'::offer_status, is_active = false, updated_at = NOW()
      WHERE status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
      RETURNING id
    `);
    const expiredCount = expiredRes.length;

    // Étape 2 : archiver les offres expired depuis >90 jours (NFR-S3).
    const archivedRes = await db.execute(sql<{ id: string }>`
      UPDATE offers
      SET status = 'archived'::offer_status,
          description = NULL,
          raw_payload = NULL,
          updated_at = NOW()
      WHERE status = 'expired'
        AND updated_at < NOW() - INTERVAL '90 days'
      RETURNING id
    `);
    const archivedCount = archivedRes.length;

    const durationMs = Date.now() - start;
    logger.info(
      { expired: expiredCount, archived: archivedCount, durationMs },
      'Deactivate offers complete',
    );
    return { ok: true, expired: expiredCount, archived: archivedCount, durationMs };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'Deactivate offers failed');
    return { ok: false, error: errMessage };
  }
}
