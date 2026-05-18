import { ParentalConsentForm } from './ParentalConsentForm';

export default function ParentalConsentPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Tu as moins de 18 ans</h2>
          <p className="text-sm text-neutral-600">
            La loi française demande l'accord de ton parent ou tuteur légal avant que tu puisses
            utiliser SwipeJob. On va lui envoyer un email pour qu'il/elle confirme.
          </p>
        </div>
        <ParentalConsentForm />
      </div>
    </div>
  );
}
