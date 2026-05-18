import { requireVerifiedAuth } from '@/lib/auth';
import { getDailyDeck } from './actions';
import { MatchExplanationPopover } from './MatchExplanationPopover';

export default async function DeckPage() {
  await requireVerifiedAuth({});
  const deck = await getDailyDeck();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Ton deck quotidien 🎴</h1>
        <p className="text-sm text-neutral-600">
          {deck.offers.length} offre{deck.offers.length > 1 ? 's' : ''} pour toi aujourd&apos;hui.
          {deck.fallback ? ' (mode découverte : on calcule encore ton matching)' : ''}
        </p>
      </header>

      {deck.scarcityHint ? (
        <div className="rounded-md border border-primary-500/40 bg-primary-100/30 p-4">
          <p className="text-sm font-medium text-neutral-900">💡 Conseil du coach</p>
          <p className="mt-1 text-sm text-neutral-700">{deck.scarcityHint.message}</p>
          {deck.scarcityHint.type === 'broaden_radius' ||
          deck.scarcityHint.type === 'broaden_cities' ? (
            <a
              href="/etape-2-preferences"
              className="mt-2 inline-block rounded-md bg-primary-500 px-3 py-2 text-xs font-medium text-white hover:bg-primary-600 min-h-[40px]"
            >
              Modifier mes préférences
            </a>
          ) : (
            <a
              href="/profil"
              className="mt-2 inline-block rounded-md bg-primary-500 px-3 py-2 text-xs font-medium text-white hover:bg-primary-600 min-h-[40px]"
            >
              Revoir mon profil
            </a>
          )}
        </div>
      ) : null}

      {deck.offers.length === 0 ? (
        <div className="rounded-md border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">
            Pas d&apos;offre disponible pour le moment. Reviens dans quelques heures, le catalogue
            est mis à jour en permanence.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {deck.offers.map((offer) => (
            <li key={offer.id}>
              <article className="rounded-md border border-neutral-200 bg-white p-4 hover:border-neutral-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-neutral-900 truncate">
                      {offer.title}
                    </h2>
                    <p className="text-sm text-neutral-600">
                      {offer.companyName ?? 'Entreprise non précisée'}
                      {offer.locationCity ? ` · ${offer.locationCity}` : ''}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {offer.contractType ? `${offer.contractType} · ` : ''}
                      {offer.salaryMinMonthly || offer.salaryMaxMonthly
                        ? `${offer.salaryMinMonthly ?? '?'}–${offer.salaryMaxMonthly ?? '?'}€/mois`
                        : 'Salaire NC'}
                    </p>
                  </div>
                  {!deck.fallback && offer.matchScore > 0 ? (
                    <MatchExplanationPopover
                      score={offer.matchScore}
                      reasons={offer.matchReasons}
                    />
                  ) : null}
                </div>
                {offer.sourceUrl ? (
                  <p className="mt-2 text-xs">
                    <a
                      className="text-primary-500 hover:underline"
                      href={offer.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Voir l&apos;offre originale →
                    </a>
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
