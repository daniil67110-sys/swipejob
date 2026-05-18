export default function ParentalConsentSentPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <div className="space-y-6 rounded-lg border border-success-500/40 bg-success-100/30 p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Email envoyé</h2>
          <p className="text-sm text-neutral-800">
            Un email vient d'être envoyé à ton parent. Une fois qu'il aura cliqué sur le lien et
            confirmé, tu pourras utiliser SwipeJob. Tu peux fermer cette page.
          </p>
          <p className="text-sm text-neutral-800">
            Le lien est valide pendant 7 jours. Si ton parent ne reçoit pas l'email, vérifie les
            spams ou reviens demander un nouveau lien.
          </p>
        </div>
      </div>
    </div>
  );
}
