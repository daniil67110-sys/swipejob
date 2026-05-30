import { LogIn } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isAuthConfigured, isEmailConfigured } from '@/lib/env';
import { EmailLoginForm } from './EmailLoginForm';

export default async function ConnexionPage(props: { searchParams: Promise<{ next?: string }> }) {
  const params = await props.searchParams;
  const nextPath = params.next;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)]">
      <div className="space-y-6 p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-[#f7f5f1] px-3 py-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-700">
            <LogIn className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Connexion
          </span>
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight tracking-tight text-neutral-900">
            Reconnecte<span className="italic font-light text-neutral-400">-toi</span>
          </h2>
          <p className="text-body-sm text-neutral-600">
            Choisis ta méthode de connexion habituelle.
          </p>
        </div>

        {isAuthConfigured ? <GoogleSignInButton nextPath={nextPath} /> : null}

        {isEmailConfigured ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-caption font-medium uppercase tracking-[0.18em] text-neutral-400">
                  ou
                </span>
              </div>
            </div>
            <EmailLoginForm />
          </>
        ) : null}

        <div className="space-y-2 border-t border-neutral-200 pt-4 text-center">
          {isEmailConfigured ? (
            <p className="text-body-sm text-neutral-500">
              <a
                className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
                href="/mot-de-passe-oublie"
              >
                Mot de passe oublié ?
              </a>
            </p>
          ) : null}
          <p className="text-body-sm text-neutral-500">
            Pas encore de compte ?{' '}
            <a
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
              href="/inscription"
            >
              S&apos;inscrire
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
