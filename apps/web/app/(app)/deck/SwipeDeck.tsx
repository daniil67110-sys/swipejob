'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Heart, PartyPopper, Sparkles, X } from 'lucide-react';
import { SwipeCard, UndoToast, type SwipeCardData } from './SwipeCard';
import { OfferDetailModal } from './OfferDetailModal';
import { swipeOfferAction } from './swipe-actions';

export function SwipeDeck({
  offers,
  showExplanation,
}: {
  offers: SwipeCardData[];
  showExplanation: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [detailOffer, setDetailOffer] = useState<SwipeCardData | null>(null);
  const [undo, setUndo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = offers.length;
  const current = offers[index];
  const isFinished = index >= total;

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (!current) return;
    setError(null);
    startTransition(async () => {
      const res = await swipeOfferAction({ offerId: current.id, direction });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      if (res.data.applicationId) setUndo(res.data.applicationId);
      setIndex((i) => Math.min(i + 1, total));
      startTransition(() => router.refresh());
    });
  };

  // Raccourcis clavier
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipe('right');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleSwipe('up');
      } else if (e.key === ' ') {
        e.preventDefault();
        setDetailOffer(current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current]);

  if (total === 0 || !current) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-12 text-center shadow-md">
        <Sparkles
          className="w-10 h-10 text-neutral-300 mx-auto mb-4"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p className="text-body-md font-semibold text-neutral-900 mb-1">
          Pas d&apos;offre pour le moment
        </p>
        <p className="text-body-sm text-neutral-500">
          Reviens dans quelques heures pour découvrir de nouvelles opportunités.
        </p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="rounded-2xl border border-success-100 bg-success-100/30 p-12 text-center shadow-md">
        <PartyPopper
          className="w-10 h-10 text-success-500 mx-auto mb-4"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p className="text-body-md font-semibold text-neutral-900 mb-1">Deck du jour terminé</p>
        <p className="text-body-sm text-neutral-700">
          Bravo, tu as parcouru toutes tes offres. Reviens demain pour de nouvelles opportunités.
        </p>
      </div>
    );
  }

  const progressPct = ((index + 1) / total) * 100;
  const remaining = total - index - 1;

  return (
    <>
      <div className="space-y-4 pb-32">
        {/* Progress bar */}
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between text-caption font-semibold">
            <span className="tracking-wider text-neutral-600 uppercase">
              Carte {index + 1} sur {total}
            </span>
            <span className="text-neutral-400">
              {remaining > 0
                ? `${remaining} restante${remaining > 1 ? 's' : ''}`
                : 'Dernière carte'}
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-info-500 via-primary-500 to-success-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={index + 1}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label={`Carte ${index + 1} sur ${total}`}
            />
          </div>
        </div>

        <SwipeCard
          key={current.id}
          offer={current}
          showExplanation={showExplanation}
          onSwipe={handleSwipe}
          onShowDetail={() => setDetailOffer(current)}
        />

        {error ? (
          <p role="alert" aria-live="polite" className="text-caption text-error-500 text-center">
            {error}
          </p>
        ) : null}
      </div>

      {/* Boutons d'actions flottants style Tinder */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 pointer-events-none">
        {/* Fade gradient pour cacher le contenu sous les boutons */}
        <div className="h-32 bg-gradient-to-t from-neutral-50 via-neutral-50/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-5 px-6">
          {/* Passer — small left */}
          <button
            type="button"
            onClick={() => handleSwipe('left')}
            disabled={isPending}
            aria-label="Passer cette offre"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white text-error-500 flex items-center justify-center shadow-[0_8px_24px_rgba(255,71,87,0.35)] ring-2 ring-error-100 hover:scale-110 hover:shadow-[0_12px_32px_rgba(255,71,87,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-7 h-7" strokeWidth={3} aria-hidden="true" />
          </button>

          {/* Favoris — small middle */}
          <button
            type="button"
            onClick={() => handleSwipe('up')}
            disabled={isPending}
            aria-label="Ajouter aux favoris"
            className="pointer-events-auto w-12 h-12 rounded-full bg-white text-info-500 flex items-center justify-center shadow-[0_8px_24px_rgba(57,152,255,0.35)] ring-2 ring-info-100 hover:scale-110 hover:shadow-[0_12px_32px_rgba(57,152,255,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bookmark className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
          </button>

          {/* Candidater — big right (primary action) */}
          <button
            type="button"
            onClick={() => handleSwipe('right')}
            disabled={isPending}
            aria-label="Candidater"
            className="pointer-events-auto w-16 h-16 rounded-full bg-gradient-to-br from-success-500 to-info-500 text-white flex items-center justify-center shadow-[0_8px_28px_rgba(31,184,122,0.5)] hover:scale-110 hover:shadow-[0_12px_36px_rgba(31,184,122,0.65)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Heart className="w-7 h-7" fill="currentColor" aria-hidden="true" />
          </button>
        </div>
      </div>

      {detailOffer ? (
        <OfferDetailModal offer={detailOffer} onClose={() => setDetailOffer(null)} />
      ) : null}
      {undo ? <UndoToast applicationId={undo} onDismiss={() => setUndo(null)} /> : null}
    </>
  );
}
