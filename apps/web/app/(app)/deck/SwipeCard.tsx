'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { swipeOfferAction, undoApplicationAction } from './swipe-actions';
import { MatchExplanationPopover, type MatchReason } from './MatchExplanationPopover';

export type SwipeCardData = {
  id: string;
  title: string;
  companyName: string | null;
  locationCity: string | null;
  contractType: string | null;
  description?: string | null;
  salaryMinMonthly: number | null;
  salaryMaxMonthly: number | null;
  sourceUrl: string | null;
  matchScore: number;
  matchReasons: MatchReason[];
};

/**
 * Story 3.1 V1 — SwipeCard avec boutons d'action (sans Framer Motion).
 * Story 3.4 — boutons + raccourcis clavier ←/→/↑/Espace.
 * Story 3.8 — UndoToast post-swipe droite (30s window).
 *
 * V2 : Framer Motion drag/spring/rotation, overlays colorés, prefers-reduced-motion.
 * V1 garde la simplicité : boutons accessibles + raccourcis clavier.
 */
export function SwipeCard({
  offer,
  showExplanation,
  onSwiped,
  onShowDetail,
  focused,
}: {
  offer: SwipeCardData;
  showExplanation: boolean;
  onSwiped: (direction: 'left' | 'right' | 'up', applicationId?: string) => void;
  onShowDetail: () => void;
  focused: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const swipe = (direction: 'left' | 'right' | 'up') => {
    setError(null);
    startTransition(async () => {
      const res = await swipeOfferAction({ offerId: offer.id, direction });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      onSwiped(direction, res.data.applicationId);
      startTransition(() => router.refresh());
    });
  };

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        swipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        swipe('right');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        swipe('up');
      } else if (e.key === ' ') {
        e.preventDefault();
        onShowDetail();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused, offer.id, onShowDetail]);

  return (
    <article
      role="article"
      aria-label={`Offre ${offer.title} chez ${offer.companyName ?? 'entreprise non précisée'}`}
      className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900">{offer.title}</h2>
          <p className="text-sm text-neutral-700">
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
        {showExplanation && offer.matchScore > 0 ? (
          <MatchExplanationPopover score={offer.matchScore} reasons={offer.matchReasons} />
        ) : null}
      </div>

      {offer.description ? (
        <p className="text-sm italic text-neutral-700 line-clamp-2">{offer.description}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onShowDetail}
          className="text-xs font-medium text-primary-500 hover:underline"
        >
          Plus d&apos;infos →
        </button>
        {offer.sourceUrl ? (
          <a
            href={offer.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 hover:underline"
          >
            Voir source
          </a>
        ) : null}
      </div>

      <div className="flex items-center justify-around border-t border-neutral-200 pt-3 gap-2">
        <button
          type="button"
          onClick={() => swipe('left')}
          disabled={isPending}
          aria-label="Passer cette offre (raccourci flèche gauche)"
          className="flex items-center justify-center rounded-full bg-error-100 hover:bg-error-100/80 text-error-500 w-14 h-14 disabled:opacity-50 min-h-[44px]"
        >
          ❌
        </button>
        <button
          type="button"
          onClick={() => swipe('up')}
          disabled={isPending}
          aria-label="Sauvegarder cette offre (raccourci flèche haut)"
          className="flex items-center justify-center rounded-full bg-primary-100 hover:bg-primary-100/80 text-primary-500 w-14 h-14 disabled:opacity-50 min-h-[44px]"
        >
          💾
        </button>
        <button
          type="button"
          onClick={() => swipe('right')}
          disabled={isPending}
          aria-label="Candidater à cette offre (raccourci flèche droite)"
          className="flex items-center justify-center rounded-full bg-success-100 hover:bg-success-100/80 text-success-500 w-14 h-14 disabled:opacity-50 min-h-[44px]"
        >
          💌
        </button>
      </div>

      {error ? (
        <p role="alert" aria-live="polite" className="text-xs text-error-500">
          {error}
        </p>
      ) : null}
    </article>
  );
}

/**
 * UndoToast (Story 3.8) — apparait après swipe droite, 30s window.
 */
export function UndoToast({
  applicationId,
  onDismiss,
}: {
  applicationId: string;
  onDismiss: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (secondsLeft <= 0) {
      onDismiss();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onDismiss]);

  const handleUndo = () => {
    startTransition(async () => {
      const res = await undoApplicationAction(applicationId);
      if (res.ok) {
        onDismiss();
        router.refresh();
      }
    });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-neutral-900 text-white px-4 py-3 shadow-lg flex items-center gap-3 z-50"
    >
      <span className="text-sm">Candidature envoyée 💌 · annulable ({secondsLeft}s)</span>
      <button
        type="button"
        onClick={handleUndo}
        disabled={isPending}
        className="text-xs font-medium text-primary-100 hover:text-white underline disabled:opacity-50"
      >
        Annuler
      </button>
    </div>
  );
}
