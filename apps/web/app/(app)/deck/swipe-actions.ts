'use server';

import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import {
  applicationEvents,
  applications,
  offers,
  swipeEvents,
  watchlist,
} from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { enqueueApplicationProcess } from '@/lib/queue';
import { isOverQuota, getDailyQuota } from '@/lib/swipe-quota';
import { serverLogger as logger } from '@/lib/logger.server';
import { checkAndUnlockBadges, type BadgeDef } from '@/lib/badges';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const swipeSchema = z.object({
  offerId: z.string().min(1).max(40),
  direction: z.enum(['left', 'right', 'up']),
});

const UNDO_WINDOW_MS = 30_000;

/**
 * Story 3.4 — swipe.
 *
 * Anti-doublon Story 3.10 : check existing swipe_events + applications par offerId.
 * Quota Story 3.9 : si direction='right' et >= quota → DAILY_QUOTA_REACHED.
 * Si right : crée application status='pending_letter' + enqueue process-application.
 * Si up : insert watchlist.
 * Si left : juste swipe_events (rien d'autre).
 */
export async function swipeOfferAction(rawInput: {
  offerId: string;
  direction: 'left' | 'right' | 'up';
}): Promise<
  ActionResult<{
    direction: 'left' | 'right' | 'up';
    applicationId?: string;
    quotaLeft?: number;
    /** Story 5.2 — badges débloqués par cette action (à afficher côté client). */
    unlockedBadges?: BadgeDef[];
  }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }

  const parsed = swipeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }

  const userId = session.user.id;
  const { offerId, direction } = parsed.data;

  // Vérifier que l'offre existe et est active
  const offerRows = await db
    .select({ id: offers.id, status: offers.status })
    .from(offers)
    .where(eq(offers.id, offerId))
    .limit(1);
  if (!offerRows[0] || offerRows[0].status !== 'active') {
    return { ok: false, error: { code: 'OFFER_INACTIVE', message: 'Offre indisponible.' } };
  }

  try {
    // Insert swipe_event (idempotent via UNIQUE constraint).
    await db.insert(swipeEvents).values({ userId, offerId, direction }).onConflictDoNothing();

    if (direction === 'left') {
      captureServer('swipe.performed', hashUserId(userId), { direction });
      await auditLog({
        actorId: userId,
        actorType: 'USER',
        event: 'swipe.performed',
        targetType: 'offer',
        targetId: offerId,
        metadata: { direction },
      });
      const unlockedBadges = await checkAndUnlockBadges(userId);
      return { ok: true, data: { direction, unlockedBadges } };
    }

    if (direction === 'up') {
      await db.insert(watchlist).values({ userId, offerId }).onConflictDoNothing();
      captureServer('swipe.performed', hashUserId(userId), { direction });
      await auditLog({
        actorId: userId,
        actorType: 'USER',
        event: 'swipe.performed',
        targetType: 'offer',
        targetId: offerId,
        metadata: { direction },
      });
      const unlockedBadges = await checkAndUnlockBadges(userId);
      return { ok: true, data: { direction, unlockedBadges } };
    }

    // direction === 'right' : flow candidature
    // Story 3.10 anti-doublon : check application existante non-cancelled
    const existingApp = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.offerId, offerId),
          sql`${applications.status} != 'cancelled_by_user'`,
        ),
      )
      .limit(1);
    if (existingApp[0]) {
      captureServer('application.duplicate_attempt', hashUserId(userId), {});
      return {
        ok: false,
        error: { code: 'ALREADY_APPLIED', message: 'Tu as déjà candidaté à cette offre.' },
      };
    }

    // Story 3.9 quota
    if (await isOverQuota(userId)) {
      const quota = await getDailyQuota(userId);
      captureServer('quota.reached', hashUserId(userId), { quota });
      await auditLog({
        actorId: userId,
        actorType: 'USER',
        event: 'quota.daily_limit_reached',
        metadata: { quota },
      });
      return {
        ok: false,
        error: {
          code: 'DAILY_QUOTA_REACHED',
          message: `Tu as atteint ta limite de ${quota} candidatures aujourd'hui. Reviens demain ☀️`,
        },
      };
    }

    // Crée application pending_letter
    const inserted = await db
      .insert(applications)
      .values({ userId, offerId, status: 'pending_letter' })
      .returning({ id: applications.id });
    const applicationId = inserted[0]?.id;
    if (!applicationId) throw new Error('Insert application returned no row');

    await db.insert(applicationEvents).values({
      applicationId,
      event: 'pending_letter',
      metadata: null,
    });

    // Enqueue worker (génère lettre + envoie)
    await enqueueApplicationProcess({ applicationId });

    captureServer('swipe.performed', hashUserId(userId), { direction });
    captureServer('application.created', hashUserId(userId), { applicationId });
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'swipe.performed',
      targetType: 'offer',
      targetId: offerId,
      metadata: { direction, applicationId },
    });

    const unlockedBadges = await checkAndUnlockBadges(userId);
    return { ok: true, data: { direction, applicationId, unlockedBadges } };
  } catch (err) {
    logger.error({ err, userId, offerId, direction }, 'swipeOfferAction failed');
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' } };
  }
}

/**
 * Story 3.8 — undo. 30s window après sentAt OU pending_letter/generated/review.
 */
export async function undoApplicationAction(
  applicationId: string,
): Promise<ActionResult<{ cancelled: true }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  const userId = session.user.id;

  try {
    const rows = await db
      .select({
        id: applications.id,
        status: applications.status,
        sentAt: applications.sentAt,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1);
    const app = rows[0];
    if (!app) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } };
    }
    if (app.status === 'cancelled_by_user') {
      return { ok: true, data: { cancelled: true } };
    }

    // Window check : 30s depuis sentAt si déjà envoyée, sinon toujours possible
    if (app.sentAt) {
      const elapsed = Date.now() - app.sentAt.getTime();
      if (elapsed > UNDO_WINDOW_MS) {
        return {
          ok: false,
          error: { code: 'WINDOW_EXPIRED', message: "Délai d'annulation dépassé (30s)." },
        };
      }
    }

    await db
      .update(applications)
      .set({ status: 'cancelled_by_user', cancelledAt: new Date() })
      .where(eq(applications.id, applicationId));

    await db.insert(applicationEvents).values({
      applicationId,
      event: 'cancelled',
      metadata: JSON.stringify({ reason: 'user_undo' }),
    });

    const timeToUndoMs = Date.now() - app.createdAt.getTime();
    captureServer('application.undone', hashUserId(userId), { time_to_undo_ms: timeToUndoMs });
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'application.cancelled',
      targetType: 'application',
      targetId: applicationId,
      metadata: { reason: 'user_undo', timeToUndoMs },
    });

    return { ok: true, data: { cancelled: true } };
  } catch (err) {
    logger.error({ err, userId, applicationId }, 'undoApplicationAction failed');
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' } };
  }
}
