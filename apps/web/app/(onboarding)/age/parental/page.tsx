import { Shield } from 'lucide-react';
import { ParentalConsentForm } from './ParentalConsentForm';

export default function ParentalConsentPage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-12">
      <div className="relative rounded-2xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-warning-500" />
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-100 text-warning-500 text-caption font-semibold tracking-wide">
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              Mineur
            </span>
            <h2 className="text-display-md font-display font-bold text-neutral-900">
              Tu as moins de 18 ans
            </h2>
            <p className="text-body-sm text-neutral-600">
              La loi française demande l&apos;accord de ton parent ou tuteur légal avant que tu
              puisses utiliser SwipeJob. On va lui envoyer un email pour qu&apos;il/elle confirme.
            </p>
          </div>
          <ParentalConsentForm />
        </div>
      </div>
    </div>
  );
}
