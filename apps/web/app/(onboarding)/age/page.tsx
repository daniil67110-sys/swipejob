import { BirthDateForm } from './BirthDateForm';

export default function OnboardingAgePage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            On a besoin de ta date de naissance
          </h2>
          <p className="text-sm text-neutral-600">
            Obligation légale française pour vérifier que tu peux utiliser SwipeJob.
          </p>
        </div>
        <BirthDateForm />
        <p className="text-xs text-neutral-500">
          Tes données sont stockées chiffrées et ne sont jamais partagées. Voir notre{' '}
          <a
            className="font-medium text-primary-500 hover:underline"
            href="/politique-confidentialite"
          >
            politique de confidentialité
          </a>
          .
        </p>
      </div>
    </div>
  );
}
