import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db, isDatabaseConfigured } from '@/lib/db';
import { parentalConsents, users } from '@swipejob/db/schema';
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
    body: 'Ce lien a expiré (7 jours). Demandez à votre enfant de renvoyer la demande.',
  },
  already: {
    title: 'Déjà traité',
    body: 'Ce consentement a déjà été enregistré. Aucune action supplémentaire requise.',
  },
  ok: {
    title: 'Merci !',
    body: 'Le compte de votre enfant est désormais activé. Il peut commencer à utiliser SwipeJob.',
  },
  not_configured: {
    title: 'Service indisponible',
    body: "Le service de consentement parental n'est pas encore configuré.",
  },
};

export default async function ConfirmerPage(props: { searchParams: Promise<{ token?: string }> }) {
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
      parentEmail: parentalConsents.parentEmail,
    })
    .from(parentalConsents)
    .where(eq(parentalConsents.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) return renderOutcome('invalid');
  // Check expiration AVANT le check de statut (un token expiré qui a déjà été
  // marqué EXPIRED ailleurs doit afficher 'expired' clair, pas 'already').
  if (row.expiresAt.getTime() < Date.now()) {
    await db
      .update(parentalConsents)
      .set({ status: 'EXPIRED' })
      .where(eq(parentalConsents.id, row.id));
    return renderOutcome('expired');
  }
  if (row.status !== 'PENDING') return renderOutcome('already');

  try {
    // Transaction : si crash entre l'update consent et l'update user, le mineur
    // pourrait rester bloqué consentStatus=PENDING_PARENTAL_CONSENT alors que
    // le parent a cliqué. Atomicité = idempotence.
    await db.transaction(async (tx) => {
      await tx
        .update(parentalConsents)
        .set({
          status: 'GRANTED',
          respondedAt: new Date(),
          ipAddress: ip,
          userAgent: userAgent ?? null,
        })
        .where(and(eq(parentalConsents.id, row.id), eq(parentalConsents.status, 'PENDING')));
      await tx.update(users).set({ consentStatus: 'GRANTED' }).where(eq(users.id, row.userId));
    });

    captureServer('consent.parental_granted', hashUserId(row.userId), {});
    await auditLog({
      actorId: row.userId,
      actorType: 'SYSTEM',
      event: 'consent.parental_granted',
      targetType: 'user',
      targetId: row.userId,
      metadata: { parentalConsentId: row.id },
    });
  } catch (err) {
    logger.error({ err, consentId: row.id }, 'parental confirmer failed');
    return renderOutcome('invalid');
  }

  return renderOutcome('ok');
}

function renderOutcome(outcome: Outcome) {
  const m = MESSAGES[outcome];
  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{m.title}</h2>
        <p className="text-sm text-neutral-600">{m.body}</p>
      </div>
    </div>
  );
}
