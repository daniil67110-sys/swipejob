import { Lightbulb, Sparkles, Target } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { env } from '@/lib/env';
import { getDailyDeck } from './actions';
import { SwipeDeck } from './SwipeDeck';
import { DailyStreak } from '@/components/engagement/DailyStreak';
import { computeUserStreak } from '@/lib/streaks';

export default async function DeckPage() {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  const [deck, streak] = await Promise.all([
    getDailyDeck(),
    userId ? computeUserStreak(userId) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          {deck.fallback ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-700">
              <Sparkles className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
              Mode découverte
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-white">
              <Target className="h-3.5 w-3.5 text-primary-400" aria-hidden="true" />
              Matching personnalisé
            </span>
          )}
          <DailyStreak initial={streak} />
        </div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
          Ton deck <span className="italic font-light text-neutral-400">du jour</span>
        </h1>
      </header>

      {deck.scarcityHint ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Lightbulb className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="mb-1 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Conseil du coach
              </p>
              <p className="mb-4 text-body-md text-neutral-700">{deck.scarcityHint.message}</p>
              {deck.scarcityHint.type === 'broaden_radius' ||
              deck.scarcityHint.type === 'broaden_cities' ? (
                <a
                  href="/etape-2-preferences"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-body-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Modifier mes préférences →
                </a>
              ) : (
                <a
                  href="/profil"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-body-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Revoir mon profil →
                </a>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <SwipeDeck offers={deck.offers} showExplanation={!deck.fallback} siteUrl={env.SITE_URL} />
    </div>
  );
}
