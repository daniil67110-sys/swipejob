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
    <div className="relative rounded-2xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
      {/* Gradient bar top */}
      <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />

      <div className="p-8 space-y-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Bienvenue
          </span>
          <h2 className="text-display-md font-display font-bold text-neutral-900">
            Crée ton compte
          </h2>
          <p className="text-body-sm text-neutral-600">
            En 1 clic avec Google. Aucun mot de passe à retenir.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-error-100 bg-error-100/50 p-3 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-body-sm text-error-500">{errorMessage}</p>
          </div>
        ) : null}

        {isAuthConfigured ? <GoogleSignInButton nextPath={nextPath} /> : null}

        <div className="space-y-2 text-center pt-2 border-t border-neutral-100">
          {isEmailConfigured ? (
            <p className="text-body-sm text-neutral-500 pt-4">
              Pas envie d&apos;utiliser Google ?{' '}
              <a
                className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
                href="/inscription/email"
              >
                S&apos;inscrire avec un email
              </a>
            </p>
          ) : null}
          <p className={`text-body-sm text-neutral-500 ${isEmailConfigured ? '' : 'pt-4'}`}>
            Déjà inscrit ?{' '}
            <a
              className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
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
