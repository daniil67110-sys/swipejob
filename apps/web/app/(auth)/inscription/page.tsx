import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isAuthConfigured } from '@/lib/env';

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
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Crée ton compte</h2>
        <p className="text-sm text-neutral-600">
          En 1 clic avec Google. Aucun mot de passe à retenir.
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-md border border-error-500/40 bg-error-100 p-3 text-sm text-error-500"
        >
          {errorMessage}
        </div>
      ) : null}

      {isAuthConfigured ? (
        <GoogleSignInButton nextPath={nextPath} />
      ) : (
        <div className="rounded-md border border-warning-500/40 bg-neutral-100 p-3 text-sm text-neutral-700">
          OAuth Google non configuré. Voir{' '}
          <code className="font-mono text-xs">docs/runbooks/auth-google.md</code>.
        </div>
      )}

      <div className="space-y-2 text-center text-sm">
        <p className="text-neutral-500">
          Déjà inscrit ?{' '}
          <a className="font-medium text-primary-500 hover:underline" href="/connexion">
            Se connecter
          </a>
        </p>
        <p className="text-xs text-neutral-400">
          L'inscription par email arrive bientôt (Story 1.4).
        </p>
      </div>
    </div>
  );
}
