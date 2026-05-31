import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { db, isDatabaseConfigured } from '@/lib/db';
import { preferences } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { SwipejobLogo } from '@/components/shared/SwipejobLogo';

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
    <main className="flex min-h-dvh flex-col bg-[#f7f5f1]">
      <header className="border-b border-neutral-200/80 bg-[#f7f5f1]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <SwipejobLogo asLink href="/" size="sm" />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">
        <div className="relative w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className={`h-1 ${ok ? 'bg-neutral-900' : 'bg-red-500'}`} />
          <div className="space-y-4 p-8">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm ${
                ok ? 'bg-neutral-900' : 'bg-red-500'
              }`}
            >
              {ok ? (
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-7 w-7" aria-hidden="true" />
              )}
            </span>
            <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight text-neutral-900">
              {ok ? (
                <>
                  Désabonnement <span className="italic text-neutral-400">confirmé</span>
                </>
              ) : (
                <>Oups…</>
              )}
            </h1>
            <p role="status" aria-live="polite" className="text-body-md text-neutral-700">
              {text}
            </p>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-body-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
