import { AlertCircle, Sparkles } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isAuthConfigured, isEmailConfigured } from '@/lib/env';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "Tu as refusé l'accès à ton compte Google. Tu peux réessayer ou choisir une autre méthode.",
  OAuthAccountNotLinked:
    'Cet email est déjà associé à un autre mode de connexion. Utilise la méthode initiale.',
  Configuration:
    "Une erreur de configuration empêche la connexion. L'équipe technique a été alertée.",
  default: 'Une erreur est survenue avec Google. Réessaie dans quelques secondes.',
};

export default async function InscriptionPage(props: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await props.searchParams;
  const errorCode = params.error;
  const nextPath = params.next;
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES['default']) : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)]">
      <div className="space-y-6 p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-[#f7f5f1] px-3 py-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-700">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Bienvenue
          </span>
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight tracking-tight text-neutral-900">
            Crée <span className="italic font-light text-neutral-400">ton compte</span>
          </h2>
          <p className="text-body-sm text-neutral-600">
            En 1 clic avec Google. Aucun mot de passe à retenir.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-body-sm text-red-700">{errorMessage}</p>
          </div>
        ) : null}

        {isAuthConfigured ? <GoogleSignInButton nextPath={nextPath} /> : null}

        <div className="space-y-2 border-t border-neutral-200 pt-4 text-center">
          {isEmailConfigured ? (
            <p className="text-body-sm text-neutral-500">
              Pas envie d&apos;utiliser Google ?{' '}
              <a
                className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
                href="/inscription/email"
              >
                S&apos;inscrire avec un email
              </a>
            </p>
          ) : null}
          <p className="text-body-sm text-neutral-500">
            Déjà inscrit ?{' '}
            <a
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
              href="/connexion"
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
