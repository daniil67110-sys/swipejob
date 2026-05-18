import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isEmailConfigured } from '@/lib/env';
import { EmailSignupForm } from './EmailSignupForm';

export default async function InscriptionEmailPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/deck');
  }

  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Crée ton compte par email</h2>
        <p className="text-sm text-neutral-600">
          On t'envoie un lien magique pour valider ton email.
        </p>
      </div>

      {isEmailConfigured ? (
        <EmailSignupForm />
      ) : (
        <div className="rounded-md border border-warning-500/40 bg-neutral-100 p-3 text-sm text-neutral-700">
          L'inscription par email n'est pas encore configurée (Resend manquant). Voir{' '}
          <code className="font-mono text-xs">docs/runbooks/email-resend.md</code>.
        </div>
      )}

      <div className="space-y-2 text-center text-sm">
        <p className="text-neutral-500">
          Déjà inscrit ?{' '}
          <a className="font-medium text-primary-500 hover:underline" href="/connexion">
            Se connecter
          </a>
        </p>
        <p className="text-neutral-400">
          <a className="hover:underline" href="/inscription">
            ← Retour à l'inscription Google
          </a>
        </p>
      </div>
    </div>
  );
}
