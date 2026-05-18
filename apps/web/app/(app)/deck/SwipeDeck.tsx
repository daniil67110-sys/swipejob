'use client';

import { useState } from 'react';
import { SwipeCard, UndoToast, type SwipeCardData } from './SwipeCard';
import { OfferDetailModal } from './OfferDetailModal';

/**
 * Story 3.2 V1 — pile de cartes simple (sans effet 3D Framer Motion).
 * V2 : stack 3D animations.
 * V1 : top card interactive, compteur "X/Y", boutons ❌💾💌, raccourcis clavier.
 * Story 3.3 — modal détail offre (Espace ou clic "Plus d'infos").
 * Story 3.8 — UndoToast post-swipe droite.
 */
export function SwipeDeck({
  offers,
  showExplanation,
}: {
  offers: SwipeCardData[];
  showExplanation: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [detailOffer, setDetailOffer] = useState<SwipeCardData | null>(null);
  const [undo, setUndo] = useState<string | null>(null);

  const total = offers.length;
  const current = offers[index];

  const handleSwiped = (_direction: 'left' | 'right' | 'up', applicationId?: string) => {
    if (applicationId) setUndo(applicationId);
    setIndex((i) => Math.min(i + 1, total));
  };

  if (total === 0 || !current) {
    return (
      <div className="rounded-md border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm text-neutral-600">
          Pas d&apos;offre disponible pour le moment. Reviens dans quelques heures.
        </p>
      </div>
    );
  }

  if (index >= total) {
    return (
      <div className="rounded-md border border-success-500/40 bg-success-100/30 p-8 text-center space-y-3">
        <p className="text-2xl">🎉</p>
        <p className="text-sm text-neutral-800">
          Bravo, tu as parcouru tout ton deck du jour ! Reviens demain pour de nouvelles offres.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs text-neutral-500" aria-live="polite">
        Carte {index + 1} sur {total}
      </p>
      <div className="relative">
        <SwipeCard
          key={current.id}
          offer={current}
          showExplanation={showExplanation}
          onSwiped={handleSwiped}
          onShowDetail={() => setDetailOffer(current)}
          focused
        />
      </div>
      {detailOffer ? (
        <OfferDetailModal offer={detailOffer} onClose={() => setDetailOffer(null)} />
      ) : null}
      {undo ? <UndoToast applicationId={undo} onDismiss={() => setUndo(null)} /> : null}
    </>
  );
}
