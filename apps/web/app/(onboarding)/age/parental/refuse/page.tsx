export default function ParentalRefusedPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <div className="space-y-6 rounded-lg border border-error-500/40 bg-error-100/30 p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Consentement refusé</h2>
          <p className="text-sm text-neutral-800">
            Ton parent ou tuteur légal n'a pas autorisé ton inscription sur SwipeJob.
          </p>
          <p className="text-sm text-neutral-800">
            Ton compte sera supprimé automatiquement sous 30 jours conformément au RGPD. Si tu
            penses que c'est une erreur, parle avec ton parent puis reviens nous voir.
          </p>
        </div>
      </div>
    </div>
  );
}
