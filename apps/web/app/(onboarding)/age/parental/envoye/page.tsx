import { Mail } from 'lucide-react';

export default function ParentalConsentSentPage() {
  return (
    <div className="mx-auto max-w-md p-6 pt-12">
      <div className="relative rounded-2xl bg-white shadow-xl border border-success-100 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-success-500 to-info-500" />
        <div className="p-8 space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-success-500 to-info-500 text-white shadow-md mx-auto">
            <Mail className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-display-md font-display font-bold text-neutral-900">Email envoyé</h2>
          <p className="text-body-sm text-neutral-700 leading-relaxed">
            Un email vient d&apos;être envoyé à ton parent. Une fois qu&apos;il aura cliqué sur le
            lien et confirmé, tu pourras utiliser SwipeJob. Tu peux fermer cette page.
          </p>
          <p className="text-caption text-neutral-500 pt-3 border-t border-neutral-100">
            Le lien est valide pendant 7 jours. Si ton parent ne reçoit pas l&apos;email, vérifie
            les spams ou reviens demander un nouveau lien.
          </p>
        </div>
      </div>
    </div>
  );
}
