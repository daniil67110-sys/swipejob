import { eq, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/node';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { offers } from '@swipejob/db/schema';
import logger from '../lib/logger.js';

const WARNING_THRESHOLD = 5000;
const CRITICAL_THRESHOLD = 3000;

export type MonitorResult =
  | { ok: true; activeCount: number; severity: 'ok' | 'warning' | 'critical' }
  | { ok: false; error: string };

/**
 * Story 2.7 — monitoring catalogue. Compte offers actives, alerte Sentry
 * selon thresholds (<5000 warning, <3000 error/critical). Cron quotidien.
 *
 * Le dashboard Axiom (visualisation 30j) = action ops humaine V2 — V1 stream
 * Pino structuré dans Axiom via le transport déjà configuré (Story 1.2).
 */
export async function processMonitorCatalog(): Promise<MonitorResult> {
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }
  try {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(offers)
      .where(eq(offers.status, 'active'));
    const activeCount = rows[0]?.count ?? 0;

    let severity: 'ok' | 'warning' | 'critical' = 'ok';
    if (activeCount < CRITICAL_THRESHOLD) severity = 'critical';
    else if (activeCount < WARNING_THRESHOLD) severity = 'warning';

    // Log structuré (Axiom dataset swipejob-worker)
    logger.info({ metric: 'offers.active.count', activeCount, severity }, 'Catalog size monitored');

    if (severity === 'critical') {
      Sentry.captureMessage(
        `Catalog critical: ${activeCount} active offers (<${CRITICAL_THRESHOLD})`,
        {
          level: 'error',
          tags: { monitor: 'catalog-size' },
          extra: { activeCount, threshold: CRITICAL_THRESHOLD },
        },
      );
    } else if (severity === 'warning') {
      Sentry.captureMessage(`Catalog low: ${activeCount} active offers (<${WARNING_THRESHOLD})`, {
        level: 'warning',
        tags: { monitor: 'catalog-size' },
        extra: { activeCount, threshold: WARNING_THRESHOLD },
      });
    }

    return { ok: true, activeCount, severity };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'Monitor catalog failed');
    return { ok: false, error: errMessage };
  }
}
