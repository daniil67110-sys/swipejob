import { ShieldOff } from 'lucide-react';

export default function RefusMineurPage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-12">
      <div className="relative rounded-2xl bg-white shadow-xl border border-error-100 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-error-500 to-warning-500" />
        <div className="p-8 space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-error-100 text-error-500 mx-auto">
            <ShieldOff className="w-8 h-8" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2 className="text-display-md font-display font-bold text-neutral-900">
            SwipeJob n&apos;est pas accessible avant 13 ans
          </h2>
          <div className="space-y-2.5 text-left">
            <p className="text-body-sm text-neutral-700 leading-relaxed">
              Désolé, la loi française et européenne nous interdit de collecter les données des
              jeunes utilisateurs en dessous de 13 ans sans procédure renforcée que nous
              n&apos;opérons pas pour le moment.
            </p>
            <p className="text-body-sm text-neutral-600 leading-relaxed">
              Ton compte vient d&apos;être désactivé et sera supprimé automatiquement sous 30 jours
              conformément au RGPD.
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <p className="text-body-sm">
              <a
                className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
                href="/help/age-minimum"
              >
                En savoir plus sur cette limite →
              </a>
            </p>
            <p className="text-caption text-neutral-500">À très vite, dans quelques années !</p>
          </div>
        </div>
      </div>
    </div>
  );
}
