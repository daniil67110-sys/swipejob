import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isAuthConfigured } from '@/lib/env';

export default async function ConnexionPage(props: { searchParams: Promise<{ next?: string }> }) {
  const params = await props.searchParams;
  const nextPath = params.next;

  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Reconnecte-toi</h2>
        <p className="text-sm text-neutral-600">
          Continue avec le même compte Google que la dernière fois.
        </p>
      </div>

      {isAuthConfigured ? (
        <GoogleSignInButton nextPath={nextPath} />
      ) : (
        <div className="rounded-md border border-warning-500/40 bg-neutral-100 p-3 text-sm text-neutral-700">
          OAuth Google non configuré. Voir{' '}
          <code className="font-mono text-xs">docs/runbooks/auth-google.md</code>.
        </div>
      )}

      <p className="text-center text-sm text-neutral-500">
        Pas encore de compte ?{' '}
        <a className="font-medium text-primary-500 hover:underline" href="/inscription">
          S'inscrire
        </a>
      </p>
    </div>
  );
}
