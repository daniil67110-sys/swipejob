import { X } from 'lucide-react';

export default function ParentalRefusedPage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-12">
      <div className="relative rounded-2xl bg-white shadow-xl border border-error-100 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-error-500 to-warning-500" />
        <div className="p-8 space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-error-100 text-error-500 mx-auto">
            <X className="w-8 h-8" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <h2 className="text-display-md font-display font-bold text-neutral-900">
            Consentement refusé
          </h2>
          <div className="space-y-2.5">
            <p className="text-body-sm text-neutral-700 leading-relaxed">
              Ton parent ou tuteur légal n&apos;a pas autorisé ton inscription sur SwipeJob.
            </p>
            <p className="text-body-sm text-neutral-600 leading-relaxed">
              Ton compte sera supprimé automatiquement sous 30 jours conformément au RGPD. Si tu
              penses que c&apos;est une erreur, parle avec ton parent puis reviens nous voir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
