import 'server-only';
import { and, count, eq, isNotNull, isNull } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/lib/db';
import { referralCodes, referrals } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { serverLogger as logger } from '@/lib/logger.server';
import { REF_CODE_LENGTH, generateReferralCode, sanitizeReferralCode } from '@/lib/referral-codes';

/**
 * Story 5.3 — Parrainage : I/O DB.
 * Les helpers purs (génération/sanitize) vivent dans @/lib/referral-codes.
 */
const MAX_CODE_RETRIES = 8;

export const REFERRAL_COOKIE_NAME = 'swipejob_ref';
export const REFERRAL_COOKIE_MAX_AGE_DAYS = 30;

export { generateReferralCode, sanitizeReferralCode };

/** Retourne le code existant ou en crée un nouveau (idempotent). */
export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  if (!isDatabaseConfigured) return null;

  const existing = await db
    .select({ code: referralCodes.code })
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0].code;

  // Génère + insert avec retry sur collision (extrêmement rare mais possible).
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const code = generateReferralCode();
    try {
      const inserted = await db
        .insert(referralCodes)
        .values({ userId, code })
        .onConflictDoNothing({ target: referralCodes.userId })
        .returning({ code: referralCodes.code });
      if (inserted[0]) return inserted[0].code;
      // ON CONFLICT a fait skip : on relit la row existante (race condition possible).
      const recheck = await db
        .select({ code: referralCodes.code })
        .from(referralCodes)
        .where(eq(referralCodes.userId, userId))
        .limit(1);
      if (recheck[0]) return recheck[0].code;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('idx_referral_codes_code')) {
        logger.error({ err, userId }, 'getOrCreateReferralCode failed');
        return null;
      }
      // Collision sur `code` unique → on retente avec un nouveau code.
    }
  }
  logger.error({ userId }, 'getOrCreateReferralCode exhausted retries');
  return null;
}

export async function findReferrerByCode(code: string): Promise<{ userId: string } | null> {
  if (!isDatabaseConfigured) return null;
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== REF_CODE_LENGTH) return null;
  const rows = await db
    .select({ userId: referralCodes.userId })
    .from(referralCodes)
    .where(eq(referralCodes.code, normalized))
    .limit(1);
  return rows[0] ?? null;
}

export type ReferralStats = {
  totalSignups: number;
  totalValidated: number;
};

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  if (!isDatabaseConfigured) return { totalSignups: 0, totalValidated: 0 };
  const [signups] = await db
    .select({ n: count() })
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));
  const [validated] = await db
    .select({ n: count() })
    .from(referrals)
    .where(and(eq(referrals.referrerUserId, userId), isNotNull(referrals.validatedAt)));
  return {
    totalSignups: Number(signups?.n ?? 0),
    totalValidated: Number(validated?.n ?? 0),
  };
}

/**
 * À appeler à la création de compte (Auth.js events.createUser + email signup
 * post-validation). Lit le cookie d'attribution, vérifie le code et insère la
 * row `referrals` correspondante. Idempotent par UNIQUE(refereeUserId).
 *
 * Anti self-referral V1 : si le code appartient au nouveau user (cas impossible
 * normalement mais on garde le check), on skip.
 */
export async function attributeReferralAtSignup(input: {
  refereeUserId: string;
  code: string;
}): Promise<{ attributed: boolean; referrerUserId?: string }> {
  if (!isDatabaseConfigured) return { attributed: false };
  const referrer = await findReferrerByCode(input.code);
  if (!referrer) return { attributed: false };
  if (referrer.userId === input.refereeUserId) {
    logger.warn(
      { refereeUserId: input.refereeUserId, code: input.code },
      'attributeReferral: self-referral blocked',
    );
    return { attributed: false };
  }
  try {
    const inserted = await db
      .insert(referrals)
      .values({
        referrerUserId: referrer.userId,
        refereeUserId: input.refereeUserId,
        code: input.code.trim().toUpperCase(),
      })
      .onConflictDoNothing({ target: referrals.refereeUserId })
      .returning({ id: referrals.id });
    if (!inserted[0]) {
      // déjà attribué → idempotent
      return { attributed: false };
    }
    await auditLog({
      actorId: input.refereeUserId,
      actorType: 'USER',
      event: 'referral.attributed',
      targetType: 'user',
      targetId: referrer.userId,
      metadata: { code: input.code.trim().toUpperCase() },
    });
    captureServer('referral.signup', hashUserId(input.refereeUserId), {
      referrer_hash: hashUserId(referrer.userId),
    });
    return { attributed: true, referrerUserId: referrer.userId };
  } catch (err) {
    logger.error({ err, ...input }, 'attributeReferralAtSignup failed');
    return { attributed: false };
  }
}

/**
 * À appeler quand le filleul effectue son premier swipe. Set `validatedAt`
 * sur sa row referrals (s'il en a une), puis déclenche le check de badges
 * pour le parrain (badge first_referral).
 *
 * Retourne le `referrerUserId` validé pour que le caller puisse trigger les
 * unlocks. La fonction n'appelle pas checkAndUnlockBadges elle-même pour
 * éviter un import circulaire avec lib/badges.ts.
 */
export async function validateReferralOnFirstSwipe(
  refereeUserId: string,
): Promise<{ validatedReferrerUserId: string | null }> {
  if (!isDatabaseConfigured) return { validatedReferrerUserId: null };
  const rows = await db
    .select({ id: referrals.id, referrerUserId: referrals.referrerUserId })
    .from(referrals)
    .where(and(eq(referrals.refereeUserId, refereeUserId), isNull(referrals.validatedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return { validatedReferrerUserId: null };

  await db.update(referrals).set({ validatedAt: new Date() }).where(eq(referrals.id, row.id));
  await auditLog({
    actorId: refereeUserId,
    actorType: 'USER',
    event: 'referral.validated',
    targetType: 'user',
    targetId: row.referrerUserId,
  });
  captureServer('referral.validated', hashUserId(refereeUserId), {
    referrer_hash: hashUserId(row.referrerUserId),
  });
  return { validatedReferrerUserId: row.referrerUserId };
}
