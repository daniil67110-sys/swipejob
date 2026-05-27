import { createHmac } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import {
  accounts,
  applicationEvents,
  applications,
  auditLogs,
  cvs,
  iaAuditLogs,
  interviewPreps,
  matchScores,
  notificationEvents,
  parentalConsents,
  preferences,
  profiles,
  pushSubscriptions,
  referralCodes,
  referrals,
  restorationTokens,
  rgpdExports,
  schools,
  sessions,
  swipeEvents,
  userBadges,
  userConsents,
  users,
  watchlist,
} from '@swipejob/db/schema';
import { env } from '../lib/env.js';
import { purgeUserR2Assets } from '../lib/r2-rgpd.js';
import logger from '../lib/logger.js';

export type RgpdDeleteResult =
  | { ok: true; userId: string; skipped?: 'restored' | 'already_purged'; deletedR2: number }
  | { ok: false; error: string };

/**
 * Story 6.4 — Job worker `rgpd-delete`.
 *
 * Conditions d'exécution :
 * - `users.deletedAt` non null (sinon le user a annulé la demande via rétractation).
 * - `users.purgedAt` null (sinon déjà purgé, idempotent skip).
 *
 * Purge :
 * 1. Supprime physiquement toutes les rows liées (CV, candidatures, swipes, badges,
 *    préférences, profil, parrainage côté referrer + referee, watchlist, push,
 *    notifications, consents, tokens, exports, scores, prep interviews, parental).
 * 2. Anonymise audit_logs + ia_audit_logs : remplace actor_id/user_id par un
 *    hash HMAC stable (clé = AUDIT_USER_HASH_SECRET ou AUTH_SECRET fallback) pour
 *    conserver la traçabilité sans PII pendant 13 mois (CNIL).
 * 3. Supprime sessions + accounts + verification_tokens du user.
 * 4. Supprime tous les objets R2 du préfixe users/<id>/ et exports/<id>/.
 * 5. Marque users.purgedAt + clear email/name/image/birthDate/passwordHash/embedding.
 * 6. Void les restoration_tokens pending.
 */
export async function processRgpdDeleteJob(userId: string): Promise<RgpdDeleteResult> {
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      deletedAt: users.deletedAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = rows[0];
  if (!user) {
    logger.warn({ userId }, 'rgpd-delete: user not found — already deleted?');
    return { ok: true, userId, deletedR2: 0 };
  }
  if (!user.deletedAt) {
    logger.info(
      { userId },
      'rgpd-delete: deletedAt cleared (user restored via /rgpd/restaurer) — skipping purge',
    );
    return { ok: true, userId, skipped: 'restored', deletedR2: 0 };
  }
  if (user.purgedAt) {
    logger.info({ userId }, 'rgpd-delete: already purged — skipping');
    return { ok: true, userId, skipped: 'already_purged', deletedR2: 0 };
  }

  const anonId = `del_${hmacUserId(userId)}`;

  try {
    // 1. Supprime les rows liées (ordre par dépendance FK).
    await db.transaction(async (tx) => {
      await tx
        .delete(applicationEvents)
        .where(
          sql`${applicationEvents.applicationId} IN (SELECT id FROM ${applications} WHERE user_id = ${userId})`,
        );
      await tx
        .delete(interviewPreps)
        .where(
          sql`${interviewPreps.applicationId} IN (SELECT id FROM ${applications} WHERE user_id = ${userId})`,
        );
      await tx.delete(applications).where(eq(applications.userId, userId));
      await tx.delete(swipeEvents).where(eq(swipeEvents.userId, userId));
      await tx.delete(watchlist).where(eq(watchlist.userId, userId));
      await tx.delete(matchScores).where(eq(matchScores.userId, userId));
      await tx.delete(cvs).where(eq(cvs.userId, userId));
      await tx.delete(preferences).where(eq(preferences.userId, userId));
      await tx.delete(userBadges).where(eq(userBadges.userId, userId));
      await tx.delete(userConsents).where(eq(userConsents.userId, userId));
      await tx.delete(referralCodes).where(eq(referralCodes.userId, userId));
      // Pour les parrainages : supprimer les rows où le user était parrain OU filleul.
      await tx
        .delete(referrals)
        .where(
          sql`${referrals.referrerUserId} = ${userId} OR ${referrals.refereeUserId} = ${userId}`,
        );
      await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
      await tx.delete(notificationEvents).where(eq(notificationEvents.userId, userId));
      await tx.delete(rgpdExports).where(eq(rgpdExports.userId, userId));
      await tx.delete(parentalConsents).where(eq(parentalConsents.userId, userId));
      await tx.delete(profiles).where(eq(profiles.userId, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      await tx.delete(restorationTokens).where(eq(restorationTokens.userId, userId));

      // 2. Anonymise audit_logs (CNIL 13 mois) — keep rows, hash actor_id/target_id.
      // Story 6.5 — table append-only via trigger PG, opt-in scoped à cette transaction.
      await tx.execute(sql`SELECT set_config('audit_logs.allow_modify', 'true', true)`);
      await tx.update(auditLogs).set({ actorId: anonId }).where(eq(auditLogs.actorId, userId));
      await tx.update(iaAuditLogs).set({ userId: null }).where(eq(iaAuditLogs.userId, userId));

      // 3. Anonymise users row : clear PII, set purgedAt.
      await tx
        .update(users)
        .set({
          email: `${anonId}@deleted.swipejob.local`,
          name: null,
          image: null,
          birthDate: null,
          passwordHash: null,
          locale: 'fr-FR',
          consentStatus: 'REFUSED',
          profileEmbedding: null,
          embeddingComputedAt: null,
          purgedAt: new Date(),
        })
        .where(eq(users.id, userId));
    });

    // schools : pas de FK directe user, mais skip prudence
    void schools;

    // 4. R2 purge
    const r2 = await purgeUserR2Assets(userId);

    logger.info(
      { userId, deletedR2: r2.deleted, anonId },
      'rgpd-delete: user purged and anonymized',
    );
    return { ok: true, userId, deletedR2: r2.deleted };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err: message, userId }, 'rgpd-delete: purge failed');
    return { ok: false, error: message };
  }
}

/**
 * Hash stable du userId pour anonymisation des audit logs.
 * Clé : `AUDIT_USER_HASH_SECRET` si défini, sinon `AUTH_SECRET` (présent en prod),
 * fallback `'rgpd-fallback'` en dev (jamais en prod — `AUTH_SECRET` est obligatoire).
 */
function hmacUserId(userId: string): string {
  const secret = env.AUDIT_USER_HASH_SECRET || env.AUTH_SECRET || 'rgpd-fallback-dev-only';
  return createHmac('sha256', secret).update(userId).digest('hex').slice(0, 16);
}
