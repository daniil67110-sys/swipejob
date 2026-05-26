import { createHash } from 'node:crypto';
import { redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { db, isDatabaseConfigured } from '@/lib/db';
import { users, verificationTokens } from '@swipejob/db/schema';
import { createDatabaseSession } from '@/lib/session';
import { getClientIp, verifyEmailRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { serverLogger as logger } from '@/lib/logger.server';
import {
  REFERRAL_COOKIE_NAME,
  attributeReferralAtSignup,
  sanitizeReferralCode,
} from '@/lib/referrals';

type Outcome = 'invalid' | 'expired' | 'rate_limited' | 'not_configured';

function hashToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

const MESSAGES: Record<Outcome, { title: string; body: string }> = {
  invalid: {
    title: 'Lien invalide',
    body: "Ce lien n'existe pas ou a déjà été utilisé. Reviens sur /inscription/email pour recevoir un nouveau lien.",
  },
  expired: {
    title: 'Lien expiré',
    body: 'Le lien a expiré (durée de vie 24h). Reviens sur /inscription/email pour recevoir un nouveau lien.',
  },
  rate_limited: {
    title: 'Trop de tentatives',
    body: 'Trop de tentatives de validation. Réessaie dans une heure.',
  },
  not_configured: {
    title: 'Service indisponible',
    body: "L'inscription par email n'est pas encore configurée. Réessaie plus tard.",
  },
};

export default async function ValiderEmailPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await props.searchParams;
  const token = params.token;

  if (!token) {
    return renderOutcome('invalid');
  }

  if (!isDatabaseConfigured) {
    return renderOutcome('not_configured');
  }

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const rl = await verifyEmailRateLimit.limit(ip);
  if (!rl.success) {
    return renderOutcome('rate_limited');
  }

  const tokenHash = hashToken(token);
  const rows = await db
    .select({
      identifier: verificationTokens.identifier,
      expires: verificationTokens.expires,
    })
    .from(verificationTokens)
    .where(eq(verificationTokens.token, tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return renderOutcome('invalid');
  }
  if (row.expires.getTime() < Date.now()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, row.identifier),
          eq(verificationTokens.token, tokenHash),
        ),
      );
    return renderOutcome('expired');
  }

  // Look up user (case-insensitive via citext)
  const userRows = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, row.identifier))
    .limit(1);
  const userRow = userRows[0];
  if (!userRow) {
    // Token orphan (user supprimé entre temps) — nettoie + invalid
    await db.delete(verificationTokens).where(eq(verificationTokens.token, tokenHash));
    return renderOutcome('invalid');
  }

  // Idempotence : si déjà vérifié (double-clic, prefetch Outlook), on consomme le
  // token + on log un user.login + on redirige vers /deck. Pas de re-fire Posthog
  // user.signup, pas d'écrasement timestamp emailVerified.
  if (userRow.emailVerified) {
    await db.delete(verificationTokens).where(eq(verificationTokens.token, tokenHash));
    try {
      await createDatabaseSession(userRow.id);
    } catch (err) {
      logger.error({ err, userId: userRow.id }, 'createDatabaseSession failed (already verified)');
      return renderOutcome('invalid');
    }
    captureServer('user.login', hashUserId(userRow.id), { method: 'magic_link_replay' });
    await auditLog({
      actorId: userRow.id,
      actorType: 'USER',
      event: 'auth.login',
      targetType: 'user',
      targetId: userRow.id,
      metadata: { method: 'magic_link_replay' },
    });
    redirect('/deck');
  }

  // Atomic : DELETE token RETURNING garantit qu'une seule requête consomme le
  // token (TOCTOU fix). Si 0 rows deleted → un autre process a déjà consommé,
  // on tombe sur "already validated" au prochain refresh. Update users.emailVerified
  // dans la même transaction pour cohérence.
  const consumed = await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, tokenHash))
      .returning({ identifier: verificationTokens.identifier });
    if (deleted.length === 0) {
      return false;
    }
    await tx.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userRow.id));
    return true;
  });
  if (!consumed) {
    return renderOutcome('invalid');
  }

  // Create DB session + cookie
  try {
    await createDatabaseSession(userRow.id);
  } catch (err) {
    logger.error({ err, userId: userRow.id }, 'createDatabaseSession failed in verify-email');
    return renderOutcome('invalid');
  }

  // Posthog + audit
  captureServer('user.signup', hashUserId(userRow.id), {
    method: 'email',
    verified: true,
  });
  await auditLog({
    actorId: userRow.id,
    actorType: 'USER',
    event: 'auth.email_verified',
    targetType: 'user',
    targetId: userRow.id,
    metadata: { method: 'magic_link' },
  });

  // Story 5.3 — attribution parrainage si cookie présent
  const jar = await cookies();
  const refCookie = jar.get(REFERRAL_COOKIE_NAME);
  const code = sanitizeReferralCode(refCookie?.value);
  if (code) {
    await attributeReferralAtSignup({ refereeUserId: userRow.id, code });
    jar.delete(REFERRAL_COOKIE_NAME);
  }

  redirect('/etape-1-cv');
}

function renderOutcome(outcome: Outcome) {
  const m = MESSAGES[outcome];
  return (
    <div className="relative rounded-2xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-warning-500 via-primary-500 to-error-500" />
      <div className="p-8 space-y-6">
        <div className="space-y-3">
          <h2 className="text-display-md font-display font-bold text-neutral-900">{m.title}</h2>
          <p className="text-body-sm text-neutral-600">{m.body}</p>
        </div>
        <div className="text-center pt-2 border-t border-neutral-100">
          <a
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-info-500 to-primary-500 px-4 py-2.5 mt-4 text-body-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow min-h-[44px]"
            href="/inscription/email"
          >
            Recevoir un nouveau lien
          </a>
        </div>
      </div>
    </div>
  );
}
