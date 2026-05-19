import { eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/lib/db';
import { preferences } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';

export const metadata = {
  title: 'Désabonnement — SwipeJob',
};

/**
 * Story 4.5/4.6 — Page un-clic unsubscribe.
 *
 * Lien envoyé dans le footer des emails marketing + digest hebdo.
 * Désactive `emailMarketingEnabled` + `emailDigestEnabled` (laisse `emailTransactionalEnabled`).
 *
 * Pas d'auth requise — le token sert d'identifiant.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token || token.length < 16 || token.length > 64) {
    return <Message ok={false} text="Lien invalide." />;
  }
  if (!isDatabaseConfigured) {
    return <Message ok={false} text="Service indisponible." />;
  }

  const rows = await db
    .select({ userId: preferences.userId })
    .from(preferences)
    .where(eq(preferences.emailUnsubscribeToken, token))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return <Message ok={false} text="Lien invalide ou expiré." />;
  }

  await db
    .update(preferences)
    .set({
      emailMarketingEnabled: false,
      emailDigestEnabled: false,
      emailDigestFrequency: 'never',
      updatedAt: new Date(),
    })
    .where(eq(preferences.userId, row.userId));

  await auditLog({
    actorId: row.userId,
    actorType: 'USER',
    event: 'preferences.unsubscribed_one_click',
    targetType: 'preferences',
    targetId: row.userId,
    metadata: { source: 'email_link' },
  });

  return (
    <Message ok={true} text="Tu es désabonné·e des emails marketing et du récap. À bientôt 👋" />
  );
}

function Message({ ok, text }: { ok: boolean; text: string }) {
  return (
    <main className="mx-auto max-w-md p-10">
      <h1 className="mb-3 text-2xl font-bold">{ok ? 'Désabonnement confirmé' : 'Oups…'}</h1>
      <p role="status" aria-live="polite" className={ok ? 'text-neutral-700' : 'text-error-500'}>
        {text}
      </p>
    </main>
  );
}
