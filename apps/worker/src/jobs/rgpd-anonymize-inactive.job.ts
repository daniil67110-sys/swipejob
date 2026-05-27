/**
 * Story 6.6 — Anonymisation automatique des comptes inactifs (RGPD durée
 * conservation proportionnée).
 *
 * Job mensuel scheduler en 2 phases parallèles :
 *
 * 1. **Notify** : users sans activité ≥ 23 mois, jamais notifiés
 *    → envoyer email "votre compte sera anonymisé dans 30j"
 *    → set `users.inactivityNotifiedAt = now()`.
 *
 * 2. **Anonymize** : users sans activité ≥ 24 mois, notifiés ≥ 30j
 *    → clear PII (email, name, image, birthDate, embedding, profile, etc.)
 *    → DELETE rows cvs + purge R2 PDFs
 *    → SET applications.cover_letter_text = NULL
 *    → keep stats (swipes, applications count, badges)
 *    → set `users.anonymizedAt = now()` + email = `anon_<hmac16>@anonymized.swipejob.local`
 *    → audit log `rgpd.anonymized` (avec bypass append-only)
 *    → email de confirmation envoyé À l'ancienne adresse AVANT clear.
 *
 * Idempotent : skip si already anonymized/purged ou si user a une activité
 * récente (cas de réveil entre J-30 et J0).
 */
import { createHmac } from 'node:crypto';
import type { Job } from 'bullmq';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { applications, auditLogs, cvs, preferences, profiles, users } from '@swipejob/db/schema';
import { env } from '../lib/env.js';
import {
  findUsersToAnonymize,
  findUsersToNotify,
  type InactivityCandidate,
} from '../lib/inactivity.js';
import logger from '../lib/logger.js';
import { purgeUserR2Assets } from '../lib/r2-rgpd.js';
import { sendAccountAnonymizedEmail, sendInactivityWarningEmail } from '../lib/resend-send.js';

export type AnonymizeInactiveResult = {
  notified: number;
  notifyErrors: number;
  anonymized: number;
  anonymizeErrors: number;
  skippedReactivated: number;
};

function hmacUserId(userId: string): string {
  const secret = env.AUDIT_USER_HASH_SECRET || env.AUTH_SECRET || 'rgpd-fallback-dev-only';
  return createHmac('sha256', secret).update(userId).digest('hex').slice(0, 16);
}

function buildLoginUrl(): string {
  // env.WEB_APP_URL pointe vers le front (cf. story 4.5 unsubscribe).
  return `${env.WEB_APP_URL.replace(/\/$/, '')}/connexion`;
}

function scheduledAnonymizationFromNotify(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + 30);
  return d;
}

export async function processAnonymizeInactiveJob(_job?: Job): Promise<AnonymizeInactiveResult> {
  const log = logger.child({ job: 'rgpd.anonymize-inactive' });
  const result: AnonymizeInactiveResult = {
    notified: 0,
    notifyErrors: 0,
    anonymized: 0,
    anonymizeErrors: 0,
    skippedReactivated: 0,
  };

  if (!isDatabaseConfigured) {
    log.warn('DATABASE_URL absent — skip job');
    return result;
  }

  const now = new Date();
  const scheduledOn = scheduledAnonymizationFromNotify(now);

  // ───── Phase 1 — Notify
  const toNotify = await findUsersToNotify(now);
  log.info({ count: toNotify.length }, 'Phase notify: users found');
  for (const candidate of toNotify) {
    try {
      await notifyUser(candidate, scheduledOn);
      result.notified += 1;
    } catch (err) {
      log.error({ err, userId: candidate.userId }, 'notify failed');
      result.notifyErrors += 1;
    }
  }

  // ───── Phase 2 — Anonymize
  const toAnonymize = await findUsersToAnonymize(now);
  log.info({ count: toAnonymize.length }, 'Phase anonymize: users found');
  for (const candidate of toAnonymize) {
    try {
      const outcome = await anonymizeUser(candidate);
      if (outcome === 'reactivated') result.skippedReactivated += 1;
      else if (outcome === 'ok') result.anonymized += 1;
    } catch (err) {
      log.error({ err, userId: candidate.userId }, 'anonymize failed');
      result.anonymizeErrors += 1;
    }
  }

  log.info(result, 'rgpd.anonymize-inactive job completed');
  return result;
}

async function notifyUser(candidate: InactivityCandidate, scheduledOn: Date): Promise<void> {
  const profileRows = await db
    .select({ firstName: profiles.firstName })
    .from(profiles)
    .where(eq(profiles.userId, candidate.userId))
    .limit(1);
  const firstName = profileRows[0]?.firstName ?? null;

  await sendInactivityWarningEmail({
    to: candidate.email,
    firstName,
    lastActivityAt: candidate.lastActivityAt,
    scheduledAnonymizationAt: scheduledOn,
    loginUrl: buildLoginUrl(),
  });

  await db
    .update(users)
    .set({ inactivityNotifiedAt: new Date() })
    .where(eq(users.id, candidate.userId));
}

async function anonymizeUser(candidate: InactivityCandidate): Promise<'ok' | 'reactivated'> {
  const anonId = `anon_${hmacUserId(candidate.userId)}`;
  const anonymizedEmail = `${anonId}@anonymized.swipejob.local`;

  // Re-read the user to check it hasn't been reactivated/purged in the meantime.
  const fresh = await db
    .select({
      id: users.id,
      anonymizedAt: users.anonymizedAt,
      purgedAt: users.purgedAt,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, candidate.userId))
    .limit(1);
  if (!fresh[0] || fresh[0].anonymizedAt || fresh[0].purgedAt) {
    return 'reactivated';
  }
  const previousEmail = fresh[0].email;

  // Profile firstName for the confirmation email (avant clear).
  const profileRows = await db
    .select({ firstName: profiles.firstName })
    .from(profiles)
    .where(eq(profiles.userId, candidate.userId))
    .limit(1);
  const firstName = profileRows[0]?.firstName ?? null;

  await db.transaction(async (tx) => {
    // 1. Clear profil PII (mais on garde la row pour stats embedding agrégées).
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
      .where(eq(profiles.userId, candidate.userId));

    // 2. Drop CVs rows (R2 sera purgé en post-transaction).
    await tx.delete(cvs).where(eq(cvs.userId, candidate.userId));

    // 3. Clear cover letters (PII textuelle).
    await tx
      .update(applications)
      .set({ coverLetterText: null })
      .where(
        and(
          eq(applications.userId, candidate.userId),
          sql`${applications.coverLetterText} IS NOT NULL`,
        ),
      );

    // 4. Clear preferences PII éventuelle (cities/criteria sont OK pour stats produit).
    // Pas de PII strictement personnelle dans preferences, donc on laisse intact.
    void preferences;

    // 5. Anonymise les audit logs (bypass append-only trigger — Story 6.5).
    await tx.execute(sql`SELECT set_config('audit_logs.allow_modify', 'true', true)`);
    await tx
      .update(auditLogs)
      .set({ actorId: anonId })
      .where(eq(auditLogs.actorId, candidate.userId));

    // 6. Insère l'event d'audit `rgpd.anonymized` (system actor).
    await tx.insert(auditLogs).values({
      actorType: 'SYSTEM',
      event: 'rgpd.anonymized',
      targetType: 'user',
      targetId: anonId,
      metadata: { reason: 'inactivity_24_months' },
    });

    // 7. Mark users row : clear PII + set anonymizedAt + replace email.
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
      .where(and(eq(users.id, candidate.userId), isNull(users.anonymizedAt)));
  });

  // 8. Out of tx : purge R2 + email de confirmation à l'ancienne adresse.
  await purgeUserR2Assets(candidate.userId).catch((err) => {
    logger.warn({ err, userId: candidate.userId }, 'R2 purge failed (continuing)');
  });

  await sendAccountAnonymizedEmail({ to: previousEmail, firstName }).catch((err) => {
    logger.warn({ err, userId: candidate.userId }, 'Anonymized email failed (continuing)');
  });

  return 'ok';
}
