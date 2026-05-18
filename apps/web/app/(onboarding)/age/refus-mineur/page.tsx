export default function RefusMineurPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <div className="space-y-6 rounded-lg border border-error-500/40 bg-error-100/30 p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            SwipeJob n'est pas accessible avant 13 ans
          </h2>
          <p className="text-sm text-neutral-800">
            Désolé, la loi française et européenne nous interdit de collecter les données des jeunes
            utilisateurs en dessous de 13 ans sans procédure renforcée que nous n'opérons pas pour
            le moment.
          </p>
          <p className="text-sm text-neutral-800">
            Ton compte vient d'être désactivé et sera supprimé automatiquement sous 30 jours
            conformément au RGPD.
          </p>
        </div>
        <p className="text-sm">
          <a className="font-medium text-primary-500 hover:underline" href="/help/age-minimum">
            En savoir plus sur cette limite
          </a>
        </p>
        <p className="text-xs text-neutral-600">À très vite, dans quelques années !</p>
      </div>
    </div>
  );
}
