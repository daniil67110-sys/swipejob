import { ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)]">
      <div className="space-y-6 p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-[#f7f5f1] px-3 py-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-700">
            <KeyRound className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Récupération
          </span>
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight tracking-tight text-neutral-900">
            Mot de passe <span className="italic font-light text-neutral-400">oublié</span>
          </h2>
          <p className="text-body-sm leading-relaxed text-neutral-600">
            Le flow self-service &quot;mot de passe oublié&quot; arrive bientôt. En attendant,
            contacte l&apos;équipe à{' '}
            <a
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
              href="mailto:support@swipejob.fr"
            >
              support@swipejob.fr
            </a>{' '}
            en précisant l&apos;email de ton compte.
          </p>
        </div>
        <div className="border-t border-neutral-200 pt-4 text-center">
          <a
            className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
            href="/connexion"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
