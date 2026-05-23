import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db, isDatabaseConfigured } from '@/lib/db';
import { parentalConsents, sessions, users } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { getClientIp } from '@/lib/rate-limit';
import { serverLogger as logger } from '@/lib/logger.server';

type Outcome = 'invalid' | 'expired' | 'already' | 'ok' | 'not_configured';

function hashToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

const MESSAGES: Record<Outcome, { title: string; body: string }> = {
  invalid: {
    title: 'Lien invalide',
    body: "Ce lien n'existe pas ou a déjà été utilisé. Contactez le support si nécessaire.",
  },
  expired: {
    title: 'Lien expiré',
    body: 'Ce lien a expiré (7 jours).',
  },
  already: {
    title: 'Déjà traité',
    body: 'Ce consentement a déjà été enregistré.',
  },
  ok: {
    title: 'Refus enregistré',
    body: 'Merci. Le compte de votre enfant sera supprimé automatiquement sous 30 jours conformément au RGPD.',
  },
  not_configured: {
    title: 'Service indisponible',
    body: 'Service non configuré.',
  },
};

export default async function RefuserPage(props: { searchParams: Promise<{ token?: string }> }) {
  const params = await props.searchParams;
  const token = params.token;
  if (!token) return renderOutcome('invalid');
  if (!isDatabaseConfigured) return renderOutcome('not_configured');

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const userAgent = hdrs.get('user-agent');

  const tokenHash = hashToken(token);
  const rows = await db
    .select({
      id: parentalConsents.id,
      userId: parentalConsents.userId,
      status: parentalConsents.status,
      expiresAt: parentalConsents.expiresAt,
    })
    .from(parentalConsents)
    .where(eq(parentalConsents.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) return renderOutcome('invalid');
  // Expiration AVANT statut (cf. confirmer/page.tsx).
  if (row.expiresAt.getTime() < Date.now()) {
    await db
      .update(parentalConsents)
      .set({ status: 'EXPIRED' })
      .where(eq(parentalConsents.id, row.id));
    return renderOutcome('expired');
  }
  if (row.status !== 'PENDING') return renderOutcome('already');

  try {
    // Transaction : les 3 ops doivent être atomiques (RGPD + sécurité).
    // Sinon un crash entre update users (deletedAt) et delete sessions
    // laisse un compte soft-deleted avec sessions actives.
    await db.transaction(async (tx) => {
      await tx
        .update(parentalConsents)
        .set({
          status: 'REFUSED',
          respondedAt: new Date(),
          ipAddress: ip,
          userAgent: userAgent ?? null,
        })
        .where(and(eq(parentalConsents.id, row.id), eq(parentalConsents.status, 'PENDING')));
      await tx
        .update(users)
        .set({ consentStatus: 'REFUSED', deletedAt: new Date() })
        .where(eq(users.id, row.userId));
      await tx.delete(sessions).where(eq(sessions.userId, row.userId));
    });

    captureServer('consent.parental_refused', hashUserId(row.userId), {});
    await auditLog({
      actorId: row.userId,
      actorType: 'SYSTEM',
      event: 'consent.parental_refused',
      targetType: 'user',
      targetId: row.userId,
      metadata: { parentalConsentId: row.id },
    });
  } catch (err) {
    logger.error({ err, consentId: row.id }, 'parental refuser failed');
    return renderOutcome('invalid');
  }

  return renderOutcome('ok');
}

function renderOutcome(outcome: Outcome) {
  const m = MESSAGES[outcome];
  return (
    <div className="relative rounded-2xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-error-500 to-warning-500" />
      <div className="p-8 space-y-3 text-center">
        <h2 className="text-display-md font-display font-bold text-neutral-900">{m.title}</h2>
        <p className="text-body-sm text-neutral-600 leading-relaxed">{m.body}</p>
      </div>
    </div>
  );
}
