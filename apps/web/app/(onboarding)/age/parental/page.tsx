import { Shield } from 'lucide-react';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { ParentalConsentForm } from './ParentalConsentForm';

export default function ParentalConsentPage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-10">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="space-y-6 p-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-caption font-semibold text-orange-700 ring-1 ring-orange-200">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Mineur
              </span>
              <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-[1.05] text-neutral-900">
                Tu as moins de <span className="italic text-neutral-400">18 ans</span>
              </h2>
              <p className="text-body-sm leading-relaxed text-neutral-600">
                La loi française demande l&apos;accord de ton parent ou tuteur légal avant que tu
                puisses utiliser SwipeJob. On va lui envoyer un email pour qu&apos;il/elle confirme.
              </p>
            </div>
            <ParentalConsentForm />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
