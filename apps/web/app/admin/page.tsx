import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin · SwipeJob',
  robots: { index: false, follow: false },
};

/**
 * Story 8.1 — Page d'accueil back-office.
 * Le contenu (KPIs santé app, jobs failed, signups 7j) sera implémenté en Story 8.2.
 * Pour 8.1, on valide le pipeline auth + layout uniquement.
 */
export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm font-display font-bold text-neutral-900">Tableau de bord</h1>
        <p className="mt-2 text-body-md text-neutral-600">
          Bienvenue dans le back-office SwipeJob. Les indicateurs et outils de modération arriveront
          dans les prochaines stories (8.2 à 8.6).
        </p>
      </header>

      <section
        aria-label="Modules à venir"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {[
          { title: 'Indicateurs santé app', story: 'Story 8.2' },
          { title: 'Gestion utilisateurs', story: 'Story 8.3' },
          { title: 'Détail utilisateur · RGPD', story: 'Story 8.4' },
          { title: 'Signalements accessibilité', story: 'Story 8.5' },
          { title: 'Journal audit + export CSV', story: 'Story 8.6' },
        ].map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <p className="text-caption uppercase tracking-wider text-neutral-500 font-semibold">
              {card.story}
            </p>
            <h2 className="mt-1 text-heading-sm font-semibold text-neutral-900">{card.title}</h2>
            <p className="mt-2 text-body-sm text-neutral-500">À venir</p>
          </article>
        ))}
      </section>
    </div>
  );
}
