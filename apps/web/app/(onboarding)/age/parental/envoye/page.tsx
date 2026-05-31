import { Mail } from 'lucide-react';
import { FadeIn } from '@/components/shared/motion/FadeIn';

export default function ParentalConsentSentPage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-10">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="space-y-5 p-8 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm">
              <Mail className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight text-neutral-900">
              Email <span className="italic text-neutral-400">envoyé</span>
            </h2>
            <p className="text-body-sm leading-relaxed text-neutral-700">
              Un email vient d&apos;être envoyé à ton parent. Une fois qu&apos;il aura cliqué sur le
              lien et confirmé, tu pourras utiliser SwipeJob. Tu peux fermer cette page.
            </p>
            <p className="border-t border-neutral-100 pt-3 text-caption text-neutral-500">
              Le lien est valide pendant 7 jours. Si ton parent ne reçoit pas l&apos;email, vérifie
              les spams ou reviens demander un nouveau lien.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
