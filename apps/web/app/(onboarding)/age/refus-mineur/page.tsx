import { ShieldOff } from 'lucide-react';
import { FadeIn } from '@/components/shared/motion/FadeIn';

export default function RefusMineurPage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-10">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
          <div className="h-1 bg-red-500" />
          <div className="space-y-5 p-8 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200">
              <ShieldOff className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold leading-tight text-neutral-900">
              SwipeJob n&apos;est pas accessible{' '}
              <span className="italic text-neutral-400">avant 13 ans</span>
            </h2>
            <div className="space-y-2.5 text-left">
              <p className="text-body-sm leading-relaxed text-neutral-700">
                Désolé, la loi française et européenne nous interdit de collecter les données des
                jeunes utilisateurs en dessous de 13 ans sans procédure renforcée que nous
                n&apos;opérons pas pour le moment.
              </p>
              <p className="text-body-sm leading-relaxed text-neutral-600">
                Ton compte vient d&apos;être désactivé et sera supprimé automatiquement sous 30
                jours conformément au RGPD.
              </p>
            </div>
            <div className="space-y-2 border-t border-neutral-100 pt-3">
              <p className="text-body-sm">
                <a
                  className="font-semibold text-orange-600 underline decoration-orange-300 underline-offset-2 hover:decoration-orange-500"
                  href="/help/age-minimum"
                >
                  En savoir plus sur cette limite →
                </a>
              </p>
              <p className="text-caption text-neutral-500">À très vite, dans quelques années !</p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
