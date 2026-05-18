import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isAuthConfigured, isEmailConfigured } from '@/lib/env';
import { EmailLoginForm } from './EmailLoginForm';

export default async function ConnexionPage(props: { searchParams: Promise<{ next?: string }> }) {
  const params = await props.searchParams;
  const nextPath = params.next;

  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Reconnecte-toi</h2>
        <p className="text-sm text-neutral-600">Choisis ta méthode de connexion habituelle.</p>
      </div>

      {isAuthConfigured ? (
        <GoogleSignInButton nextPath={nextPath} />
      ) : (
        <div className="rounded-md border border-warning-500/40 bg-neutral-100 p-3 text-sm text-neutral-700">
          OAuth Google non configuré. Voir{' '}
          <code className="font-mono text-xs">docs/runbooks/auth-google.md</code>.
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-neutral-500">ou</span>
        </div>
      </div>

      {isEmailConfigured ? (
        <EmailLoginForm />
      ) : (
        <div className="rounded-md border border-warning-500/40 bg-neutral-100 p-3 text-sm text-neutral-700">
          La connexion par email n'est pas encore configurée. Voir{' '}
          <code className="font-mono text-xs">docs/runbooks/email-resend.md</code>.
        </div>
      )}

      <div className="space-y-2 text-center text-sm">
        <p className="text-neutral-500">
          <a className="font-medium text-primary-500 hover:underline" href="/mot-de-passe-oublie">
            Mot de passe oublié ?
          </a>
        </p>
        <p className="text-neutral-500">
          Pas encore de compte ?{' '}
          <a className="font-medium text-primary-500 hover:underline" href="/inscription">
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
}
