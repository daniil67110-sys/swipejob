import { Lightbulb, Sparkles, Target } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { getDailyDeck } from './actions';
import { SwipeDeck } from './SwipeDeck';

export default async function DeckPage() {
  await requireVerifiedAuth({});
  const deck = await getDailyDeck();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        {deck.fallback ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Mode découverte
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-100 text-success-500 text-caption font-semibold tracking-wide">
            <Target className="w-3.5 h-3.5" aria-hidden="true" />
            Matching personnalisé
          </span>
        )}
      </header>

      {deck.scarcityHint ? (
        <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-body-sm font-semibold text-neutral-900 mb-1">Conseil du coach</p>
              <p className="text-body-sm text-neutral-700 mb-3">{deck.scarcityHint.message}</p>
              {deck.scarcityHint.type === 'broaden_radius' ||
              deck.scarcityHint.type === 'broaden_cities' ? (
                <a
                  href="/etape-2-preferences"
                  className="inline-flex items-center justify-center rounded-md bg-primary-500 px-3 py-2 text-caption font-semibold text-white hover:bg-primary-600 min-h-[40px]"
                >
                  Modifier mes préférences
                </a>
              ) : (
                <a
                  href="/profil"
                  className="inline-flex items-center justify-center rounded-md bg-primary-500 px-3 py-2 text-caption font-semibold text-white hover:bg-primary-600 min-h-[40px]"
                >
                  Revoir mon profil
                </a>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <SwipeDeck offers={deck.offers} showExplanation={!deck.fallback} />
    </div>
  );
}
