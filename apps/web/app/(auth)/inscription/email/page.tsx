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
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)]">
      <div className="space-y-6 p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-[#f7f5f1] px-3 py-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-700">
            <Mail className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Email
          </span>
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight tracking-tight text-neutral-900">
            Crée ton compte <span className="italic font-light text-neutral-400">par email</span>
          </h2>
          <p className="text-body-sm text-neutral-600">
            On t&apos;envoie un lien magique pour valider ton email.
          </p>
        </div>

        {isEmailConfigured ? (
          <EmailSignupForm />
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-[#f7f5f1] p-4 text-body-sm text-neutral-600">
            L&apos;inscription par email n&apos;est pas encore configurée (Resend manquant).
          </div>
        )}

        <div className="space-y-2 border-t border-neutral-200 pt-4 text-center">
          <p className="text-body-sm text-neutral-500">
            Déjà inscrit ?{' '}
            <a
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
              href="/connexion"
            >
              Se connecter
            </a>
          </p>
          <p className="text-body-sm">
            <a
              className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-700 hover:underline"
              href="/inscription"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Retour à l&apos;inscription Google
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
