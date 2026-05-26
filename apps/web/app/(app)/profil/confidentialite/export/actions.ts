'use server';

import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { rgpdExports } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { enqueueRgpdExport } from '@/lib/queue';
import { rgpdExportRateLimit } from '@/lib/rate-limit';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

/**
 * Story 6.3 — Demande d'export RGPD.
 *
 * Rate limit 1/24h/user. Crée une row rgpd_exports `pending` + enqueue le job.
 * Worker complète la row à `completed` + envoie l'email avec liens 7j.
 */
export async function requestRgpdExportAction(): Promise<
  ActionResult<{ exportId: string; mock?: boolean }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  const userId = session.user.id;

  const rl = await rgpdExportRateLimit.limit(userId);
  if (!rl.success) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Tu as déjà demandé un export dans les 24 dernières heures.',
      },
    };
  }

  const inserted = await db
    .insert(rgpdExports)
    .values({ userId })
    .returning({ id: rgpdExports.id });
  const exportId = inserted[0]?.id;
  if (!exportId) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' } };
  }

  const enqueued = await enqueueRgpdExport({ userId, exportId });
  if (!enqueued.ok) {
    logger.warn({ err: enqueued.error, userId, exportId }, 'rgpd-export enqueue failed');
  }
  const mock = enqueued.ok && 'mock' in enqueued && enqueued.mock;

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'rgpd.export_requested',
    targetType: 'user',
    targetId: userId,
    metadata: { exportId, mock },
  });
  captureServer('rgpd.export_requested', hashUserId(userId), {});

  return { ok: true, data: { exportId, mock } };
}

export type RgpdExportRow = {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  requestedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
};

export async function listMyRgpdExportsAction(): Promise<ActionResult<{ items: RgpdExportRow[] }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: true, data: { items: [] } };
  }
  const rows = await db
    .select({
      id: rgpdExports.id,
      status: rgpdExports.status,
      requestedAt: rgpdExports.requestedAt,
      completedAt: rgpdExports.completedAt,
      expiresAt: rgpdExports.expiresAt,
    })
    .from(rgpdExports)
    .where(eq(rgpdExports.userId, session.user.id))
    .orderBy(desc(rgpdExports.requestedAt))
    .limit(10);
  return {
    ok: true,
    data: {
      items: rows.map((r) => ({
        id: r.id,
        status: r.status as RgpdExportRow['status'],
        requestedAt: r.requestedAt,
        completedAt: r.completedAt,
        expiresAt: r.expiresAt,
      })),
    },
  };
}
