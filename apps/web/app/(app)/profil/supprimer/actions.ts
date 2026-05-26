'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { sessions, users } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { sendAccountDeletionEmail } from '@/lib/email';
import { enqueueRgpdDelete } from '@/lib/queue';
import { accountDeletionRateLimit } from '@/lib/rate-limit';
import { serverLogger as logger } from '@/lib/logger.server';
import { env } from '@/lib/env';
import { createRestorationToken } from '@/lib/restoration-tokens';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const schema = z.object({
  confirmEmail: z.string().email('Email invalide.'),
});

export async function requestAccountDeletionAction(rawInput: {
  confirmEmail: string;
}): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Email invalide.' } };
  }
  const userId = session.user.id;

  // Rate limit (1/h/user) — empêche flood email + audit + jobs RGPD V2
  const rl = await accountDeletionRateLimit.limit(userId);
  if (!rl.success) {
    return {
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Trop de tentatives. Réessaie dans une heure.' },
    };
  }

  try {
    const rows = await db
      .select({ id: users.id, email: users.email, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = rows[0];
    if (!user) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Compte introuvable.' } };
    }
    // Idempotence : si compte déjà soft-deleted, ne pas re-fire audit/email/job
    if (user.deletedAt) {
      return {
        ok: false,
        error: { code: 'ALREADY_DELETED', message: 'Ce compte est déjà supprimé.' },
      };
    }
    // Comparison citext : email côté DB est case-insensitive. On lowercase aussi côté input.
    if (parsed.data.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      return {
        ok: false,
        error: {
          code: 'EMAIL_MISMATCH',
          message: "L'email saisi ne correspond pas à celui de ton compte.",
        },
      };
    }

    // Transaction atomique : soft delete users + DELETE sessions.
    // Sinon crash entre les 2 → user marqué deleted mais sessions actives (RGPD).
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ deletedAt: new Date(), consentStatus: 'REFUSED' })
        .where(eq(users.id, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
    });

    captureServer('account.deletion_requested', hashUserId(userId), {});
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'account.deletion_requested',
      targetType: 'user',
      targetId: userId,
      metadata: { method: 'self_service' },
    });

    // Enqueue rgpd.delete (délai 30j). Le worker (Story 6.4) purge les PII,
    // anonymise audit_logs + ia_audit_logs et supprime les fichiers R2.
    const enqueued = await enqueueRgpdDelete({ userId });
    if (!enqueued.ok) {
      logger.warn({ err: enqueued.error, userId }, 'rgpd-delete enqueue failed');
    } else if ('mock' in enqueued && enqueued.mock) {
      logger.warn({ userId }, 'rgpd-delete enqueued in mock mode (REDIS_URL absent)');
    }

    // Story 6.4 — Token de rétractation 7j envoyé par email.
    const { plainToken, expiresAt: restoreExpiresAt } = await createRestorationToken(userId);
    const baseUrl = env.SITE_URL.replace(/\/$/, '');
    const restoreUrl = `${baseUrl}/rgpd/restaurer/${plainToken}`;
    const scheduledFor = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    await sendAccountDeletionEmail({
      to: user.email,
      restoreUrl,
      scheduledFor,
      restoreExpiresAt,
    });

    return { ok: true, data: { redirectTo: '/' } };
  } catch (err) {
    logger.error({ err, userId }, 'requestAccountDeletionAction failed');
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' } };
  }
}
