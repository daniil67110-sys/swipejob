import { redirect } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { auth } from '@/lib/auth';
import { isEmailConfigured } from '@/lib/env';
import { EmailSignupForm } from './EmailSignupForm';

export default async function InscriptionEmailPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/deck');
  }

  return (
    <div className="relative rounded-2xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
      <div className="p-8 space-y-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            Email
          </span>
          <h2 className="text-display-md font-display font-bold text-neutral-900">
            Crée ton compte par email
          </h2>
          <p className="text-body-sm text-neutral-600">
            On t&apos;envoie un lien magique pour valider ton email.
          </p>
        </div>

        {isEmailConfigured ? (
          <EmailSignupForm />
        ) : (
          <div className="rounded-xl border border-warning-100 bg-warning-100/40 p-3 text-body-sm text-neutral-700">
            L&apos;inscription par email n&apos;est pas encore configurée (Resend manquant).
          </div>
        )}

        <div className="space-y-2 text-center pt-2 border-t border-neutral-100">
          <p className="text-body-sm text-neutral-500 pt-4">
            Déjà inscrit ?{' '}
            <a
              className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
              href="/connexion"
            >
              Se connecter
            </a>
          </p>
          <p className="text-body-sm">
            <a
              className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-600 hover:underline"
              href="/inscription"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Retour à l&apos;inscription Google
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
