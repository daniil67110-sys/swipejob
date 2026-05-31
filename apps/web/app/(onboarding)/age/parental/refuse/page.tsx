import { X } from 'lucide-react';
import { FadeIn } from '@/components/shared/motion/FadeIn';

export default function ParentalRefusedPage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-10">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
          <div className="h-1 bg-red-500" />
          <div className="space-y-5 p-8 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200">
              <X className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight text-neutral-900">
              Consentement <span className="italic text-neutral-400">refusé</span>
            </h2>
            <div className="space-y-2.5">
              <p className="text-body-sm leading-relaxed text-neutral-700">
                Ton parent ou tuteur légal n&apos;a pas autorisé ton inscription sur SwipeJob.
              </p>
              <p className="text-body-sm leading-relaxed text-neutral-600">
                Ton compte sera supprimé automatiquement sous 30 jours conformément au RGPD. Si tu
                penses que c&apos;est une erreur, parle avec ton parent puis reviens nous voir.
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
