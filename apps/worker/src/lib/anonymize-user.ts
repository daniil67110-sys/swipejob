/**
 * Story 6.6 + 8.4 — Anonymisation d'un utilisateur (extrait du job inactivité
 * pour pouvoir être appelée aussi depuis l'admin via la queue manuelle).
 *
 * Logique : clear PII (profile, name, image, birthDate, embedding, cover letters),
 * DELETE cvs (R2 purge out-of-tx), réécriture audit logs avec bypass append-only,
 * mark `users.anonymizedAt` + remplacement email par alias `anon_<hmac16>`.
 *
 * Idempotent : si déjà anonymizedAt ou purgedAt, retourne 'reactivated'.
 *
 * Effets de bord post-transaction : purge R2 + email de confirmation à
 * l'ancienne adresse. Logs warn (non bloquant) si l'un échoue.
 */
import { createHmac } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@swipejob/db';
import { applications, auditLogs, cvs, profiles, users } from '@swipejob/db/schema';
import { env } from './env.js';
import logger from './logger.js';
import { purgeUserR2Assets } from './r2-rgpd.js';
import { sendAccountAnonymizedEmail } from './resend-send.js';

export type AnonymizeReason = 'inactivity_24_months' | 'admin_manual';

export type AnonymizeUserInput = {
  userId: string;
  reason: AnonymizeReason;
  /** Si reason='admin_manual', l'id de l'admin qui a déclenché. */
  triggeredByAdminId?: string;
};

export type AnonymizeOutcome = 'ok' | 'reactivated';

function hmacUserId(userId: string): string {
  const secret = env.AUDIT_USER_HASH_SECRET || env.AUTH_SECRET || 'rgpd-fallback-dev-only';
  return createHmac('sha256', secret).update(userId).digest('hex').slice(0, 16);
}

export async function anonymizeUser(input: AnonymizeUserInput): Promise<AnonymizeOutcome> {
  const { userId, reason, triggeredByAdminId } = input;
  const anonId = `anon_${hmacUserId(userId)}`;
  const anonymizedEmail = `${anonId}@anonymized.swipejob.local`;

  const fresh = await db
    .select({
      id: users.id,
      anonymizedAt: users.anonymizedAt,
      purgedAt: users.purgedAt,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!fresh[0] || fresh[0].anonymizedAt || fresh[0].purgedAt) {
    return 'reactivated';
  }
  const previousEmail = fresh[0].email;

  const profileRows = await db
    .select({ firstName: profiles.firstName })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  const firstName = profileRows[0]?.firstName ?? null;

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({
        firstName: null,
        lastName: null,
        headline: null,
        summary: null,
        phone: null,
        city: null,
        bio: null,
        linkedinUrl: null,
        experiences: null,
        educations: null,
      } as Record<string, null>)
      .where(eq(profiles.userId, userId));

    await tx.delete(cvs).where(eq(cvs.userId, userId));

    await tx
      .update(applications)
      .set({ coverLetterText: null })
      .where(
        and(eq(applications.userId, userId), sql`${applications.coverLetterText} IS NOT NULL`),
      );

    // Réécriture des audit logs avec bypass append-only (Story 6.5).
    await tx.execute(sql`SELECT set_config('audit_logs.allow_modify', 'true', true)`);
    await tx.update(auditLogs).set({ actorId: anonId }).where(eq(auditLogs.actorId, userId));

    await tx.insert(auditLogs).values({
      actorType: triggeredByAdminId ? 'ADMIN' : 'SYSTEM',
      actorId: triggeredByAdminId ?? null,
      event: reason === 'admin_manual' ? 'rgpd.anonymized_manual' : 'rgpd.anonymized',
      targetType: 'user',
      targetId: anonId,
      metadata: { reason },
    });

    await tx
      .update(users)
      .set({
        email: anonymizedEmail,
        name: null,
        image: null,
        birthDate: null,
        passwordHash: null,
        profileEmbedding: null,
        embeddingComputedAt: null,
        anonymizedAt: new Date(),
        consentStatus: 'REFUSED',
      })
      .where(and(eq(users.id, userId), isNull(users.anonymizedAt)));
  });

  await purgeUserR2Assets(userId).catch((err) => {
    logger.warn({ err, userId }, 'R2 purge failed (continuing)');
  });

  await sendAccountAnonymizedEmail({ to: previousEmail, firstName }).catch((err) => {
    logger.warn({ err, userId }, 'Anonymized email failed (continuing)');
  });

  return 'ok';
}
