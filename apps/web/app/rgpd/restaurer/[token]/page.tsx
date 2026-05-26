import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { consumeRestorationToken } from '@/lib/restoration-tokens';

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
    color: 'error',
  },
  expired: {
    title: 'Lien expiré',
    body: 'Le délai de 7 jours pour annuler ta suppression est dépassé. Ton compte est désormais en cours de purge définitive.',
    icon: Clock,
    color: 'warning',
  },
  used: {
    title: 'Lien déjà utilisé',
    body: 'Ce lien a déjà servi à annuler ta suppression. Tu peux te connecter normalement.',
    icon: AlertCircle,
    color: 'info',
  },
  already_restored: {
    title: 'Compte déjà actif',
    body: 'Ton compte est déjà actif — la suppression précédente a été annulée. Tu peux te connecter.',
    icon: CheckCircle2,
    color: 'success',
  },
  success: {
    title: 'Suppression annulée',
    body: 'Bon retour parmi nous. Ta suppression a été annulée, toutes tes données sont préservées. Connecte-toi pour reprendre où tu en étais.',
    icon: CheckCircle2,
    color: 'success',
  },
} as const;

const COLOR_BG = {
  error: 'bg-error-100 text-error-500',
  warning: 'bg-warning-100 text-warning-500',
  info: 'bg-info-100 text-info-500',
  success: 'bg-success-100 text-success-500',
} as const;

const GRADIENT = {
  error: 'from-error-500 to-warning-500',
  warning: 'from-warning-500 to-accent-500',
  info: 'from-info-500 to-primary-500',
  success: 'from-success-500 to-info-500',
} as const;

export default async function RestorePage({ params }: Props) {
  const { token } = await params;
  const result = await consumeRestorationToken(token);
  const key = result.ok ? 'success' : result.code;
  const message = MESSAGES[key];
  const Icon = message.icon;

  return (
    <div className="min-h-dvh bg-neutral-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-neutral-100">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-info-500 via-primary-500 to-success-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              S
            </span>
            <span className="text-heading-md font-display font-bold text-neutral-900">
              SwipeJob
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <article className="w-full max-w-md">
          <div className="relative rounded-2xl bg-white shadow-xl overflow-hidden border border-neutral-100">
            <div className={`h-1.5 bg-gradient-to-r ${GRADIENT[message.color]}`} />
            <div className="p-8 text-center space-y-4">
              <span
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${COLOR_BG[message.color]}`}
              >
                <Icon className="w-7 h-7" aria-hidden="true" />
              </span>
              <h1 className="text-display-md font-display font-bold text-neutral-900 leading-tight">
                {message.title}
              </h1>
              <p className="text-body-md text-neutral-600">{message.body}</p>
              {result.ok || result.code === 'used' || result.code === 'already_restored' ? (
                <Link
                  href="/connexion"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-info-500 to-primary-500 px-5 py-3 text-body-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-95 transition-all min-h-[44px]"
                >
                  Me connecter
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-5 py-3 text-body-sm font-semibold text-neutral-700 hover:border-primary-200 hover:bg-primary-50 transition-all min-h-[44px]"
                >
                  Retour à l&apos;accueil
                </Link>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
