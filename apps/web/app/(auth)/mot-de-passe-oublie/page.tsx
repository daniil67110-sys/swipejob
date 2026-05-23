import { ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="relative rounded-2xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-warning-500 to-primary-500" />
      <div className="p-8 space-y-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-100 text-warning-500 text-caption font-semibold tracking-wide">
            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
            Récupération
          </span>
          <h2 className="text-display-md font-display font-bold text-neutral-900">
            Mot de passe oublié
          </h2>
          <p className="text-body-sm text-neutral-600">
            Le flow self-service &quot;mot de passe oublié&quot; arrive bientôt. En attendant,
            contacte l&apos;équipe à{' '}
            <a
              className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
              href="mailto:support@swipejob.fr"
            >
              support@swipejob.fr
            </a>{' '}
            en précisant l&apos;email de ton compte.
          </p>
        </div>
        <div className="text-center pt-2 border-t border-neutral-100">
          <a
            className="inline-flex items-center gap-1 pt-4 font-semibold text-primary-500 hover:text-primary-600 hover:underline text-body-sm"
            href="/connexion"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
