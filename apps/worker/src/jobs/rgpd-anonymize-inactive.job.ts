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
import type { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { profiles, users } from '@swipejob/db/schema';
import { anonymizeUser } from '../lib/anonymize-user.js';
import { env } from '../lib/env.js';
import {
  findUsersToAnonymize,
  findUsersToNotify,
  type InactivityCandidate,
} from '../lib/inactivity.js';
import logger from '../lib/logger.js';
import { sendInactivityWarningEmail } from '../lib/resend-send.js';

export type AnonymizeInactiveResult = {
  notified: number;
  notifyErrors: number;
  anonymized: number;
  anonymizeErrors: number;
  skippedReactivated: number;
};

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
      const outcome = await anonymizeUser({
        userId: candidate.userId,
        reason: 'inactivity_24_months',
      });
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
