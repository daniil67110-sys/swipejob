import { LogIn } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isAuthConfigured, isEmailConfigured } from '@/lib/env';
import { EmailLoginForm } from './EmailLoginForm';

export default async function ConnexionPage(props: { searchParams: Promise<{ next?: string }> }) {
  const params = await props.searchParams;
  const nextPath = params.next;

  return (
    <div className="relative rounded-2xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
      {/* Gradient bar top */}
      <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />

      <div className="p-8 space-y-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            Connexion
          </span>
          <h2 className="text-display-md font-display font-bold text-neutral-900">
            Reconnecte-toi
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
                <div className="w-full border-t border-neutral-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-caption text-neutral-400 font-medium tracking-wider uppercase">
                  ou
                </span>
              </div>
            </div>
            <EmailLoginForm />
          </>
        ) : null}

        <div className="space-y-2 text-center pt-2 border-t border-neutral-100">
          {isEmailConfigured ? (
            <p className="text-body-sm text-neutral-500 pt-4">
              <a
                className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
                href="/mot-de-passe-oublie"
              >
                Mot de passe oublié ?
              </a>
            </p>
          ) : null}
          <p className={`text-body-sm text-neutral-500 ${isEmailConfigured ? '' : 'pt-4'}`}>
            Pas encore de compte ?{' '}
            <a
              className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
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
