import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { consumeRestorationToken } from '@/lib/restoration-tokens';
import { SwipejobLogo } from '@/components/shared/SwipejobLogo';
import { FadeIn } from '@/components/shared/motion/FadeIn';

/**
 * Story 6.4 — Page publique de rétractation d'une demande de suppression.
 *
 * Accessible sans auth (le token suffit). Au GET, on consume le token.
 * Si succès, on invite le user à se reconnecter.
 */

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Annuler ma suppression — SwipeJob',
};

type Props = {
  params: Promise<{ token: string }>;
};

const MESSAGES = {
  invalid: {
    title: 'Lien invalide',
    body: "Ce lien de rétractation n'existe pas. Vérifie que tu cliques sur le lien le plus récent que tu as reçu par email.",
    icon: XCircle,
    tone: 'error',
  },
  expired: {
    title: 'Lien expiré',
    body: 'Le délai de 7 jours pour annuler ta suppression est dépassé. Ton compte est désormais en cours de purge définitive.',
    icon: Clock,
    tone: 'warning',
  },
  used: {
    title: 'Lien déjà utilisé',
    body: 'Ce lien a déjà servi à annuler ta suppression. Tu peux te connecter normalement.',
    icon: AlertCircle,
    tone: 'info',
  },
  already_restored: {
    title: 'Compte déjà actif',
    body: 'Ton compte est déjà actif — la suppression précédente a été annulée. Tu peux te connecter.',
    icon: CheckCircle2,
    tone: 'success',
  },
  success: {
    title: 'Suppression annulée',
    body: 'Bon retour parmi nous. Ta suppression a été annulée, toutes tes données sont préservées. Connecte-toi pour reprendre où tu en étais.',
    icon: CheckCircle2,
    tone: 'success',
  },
} as const;

const TONE_BAR = {
  error: 'bg-red-500',
  warning: 'bg-orange-500',
  info: 'bg-neutral-900',
  success: 'bg-neutral-900',
} as const;

const TONE_ICON = {
  error: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  warning: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200',
  info: 'bg-neutral-900 text-white',
  success: 'bg-neutral-900 text-white',
} as const;

const ACCENT = {
  error: 'erreur',
  warning: 'expiré',
  info: 'info',
  success: 'confirmée',
} as const;

export default async function RestorePage({ params }: Props) {
  const { token } = await params;
  const result = await consumeRestorationToken(token);
  const key = result.ok ? 'success' : result.code;
  const message = MESSAGES[key];
  const Icon = message.icon;

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f5f1]">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-[#f7f5f1]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <SwipejobLogo asLink href="/" size="sm" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <article className="w-full max-w-md">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
              <div className={`h-1 ${TONE_BAR[message.tone]}`} />
              <div className="space-y-4 p-8 text-center">
                <span
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${TONE_ICON[message.tone]}`}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight text-neutral-900">
                  {message.title.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="italic text-neutral-400">
                    {message.title.split(' ').slice(-1)[0]}
                  </span>
                </h1>
                <p className="text-body-md leading-relaxed text-neutral-600">{message.body}</p>
                {result.ok || result.code === 'used' || result.code === 'already_restored' ? (
                  <Link
                    href="/connexion"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-2.5 text-body-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Me connecter
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-body-sm font-semibold text-neutral-700 transition-all hover:border-neutral-300 hover:bg-[#f7f5f1]"
                  >
                    Retour à l&apos;accueil
                  </Link>
                )}
                {/* preserve tone variable so it's used */}
                <span className="sr-only">{ACCENT[message.tone]}</span>
              </div>
            </div>
          </FadeIn>
        </article>
      </main>
    </div>
  );
}
