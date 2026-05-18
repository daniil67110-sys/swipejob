import { requireVerifiedAuth } from '@/lib/auth';
import { getDailyDeck } from './actions';
import { SwipeDeck } from './SwipeDeck';

export default async function DeckPage() {
  await requireVerifiedAuth({});
  const deck = await getDailyDeck();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Ton deck quotidien 🎴</h1>
        <p className="text-sm text-neutral-600">
          {deck.offers.length} offre{deck.offers.length > 1 ? 's' : ''} pour toi aujourd&apos;hui.
          {deck.fallback ? ' (mode découverte : on calcule encore ton matching)' : ''}
        </p>
        <p className="text-xs text-neutral-500">
          Raccourcis : ← passer · ↑ sauvegarder · → candidater · espace détail
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

      <SwipeDeck offers={deck.offers} showExplanation={!deck.fallback} />
    </div>
  );
}
