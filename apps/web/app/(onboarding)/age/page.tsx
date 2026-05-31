import { CakeSlice } from 'lucide-react';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { BirthDateForm } from './BirthDateForm';

export default function OnboardingAgePage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-10">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="space-y-6 p-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f7f5f1] px-3 py-1.5 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
                <CakeSlice className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                Vérification
              </span>
              <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-[1.05] text-neutral-900">
                On a besoin de ta <span className="italic text-neutral-400">date de naissance</span>
              </h2>
              <p className="text-body-sm text-neutral-600">
                Obligation légale française pour vérifier que tu peux utiliser SwipeJob.
              </p>
            </div>
            <BirthDateForm />
            <p className="mt-2 border-t border-neutral-100 pt-3 text-caption text-neutral-500">
              Tes données sont stockées chiffrées et ne sont jamais partagées. Voir notre{' '}
              <a
                className="font-semibold text-orange-600 underline decoration-orange-300 underline-offset-2 hover:decoration-orange-500"
                href="/politique-confidentialite"
              >
                politique de confidentialité
              </a>
              .
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
