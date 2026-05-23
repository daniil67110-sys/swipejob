import { CakeSlice } from 'lucide-react';
import { BirthDateForm } from './BirthDateForm';

export default function OnboardingAgePage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-12">
      <div className="relative rounded-2xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
              <CakeSlice className="w-3.5 h-3.5" aria-hidden="true" />
              Vérification
            </span>
            <h2 className="text-display-md font-display font-bold text-neutral-900">
              On a besoin de ta date de naissance
            </h2>
            <p className="text-body-sm text-neutral-600">
              Obligation légale française pour vérifier que tu peux utiliser SwipeJob.
            </p>
          </div>
          <BirthDateForm />
          <p className="text-caption text-neutral-500 pt-2 border-t border-neutral-100 mt-2">
            Tes données sont stockées chiffrées et ne sont jamais partagées. Voir notre{' '}
            <a
              className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
              href="/politique-confidentialite"
            >
              politique de confidentialité
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
