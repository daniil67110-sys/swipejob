'use client';

import { useEffect } from 'react';
import type { SwipeCardData } from './SwipeCard';

/**
 * Story 3.3 — modal détail offre. V1 simple : modal centré (pas bottom-sheet mobile spécifique).
 * Escape ferme. Click outside ferme. Posthog `offer.detail_viewed` (V2).
 */
export function OfferDetailModal({
  offer,
  onClose,
}: {
  offer: SwipeCardData;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-detail-title"
      className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rounded-lg bg-white max-w-2xl w-full max-h-[80vh] overflow-auto p-6 space-y-4 shadow-xl">
        <header className="space-y-1">
          <h2 id="offer-detail-title" className="text-xl font-semibold">
            {offer.title}
          </h2>
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
        </header>

        {offer.description ? (
          <div className="text-sm text-neutral-800 whitespace-pre-wrap">{offer.description}</div>
        ) : (
          <p className="text-sm text-neutral-500 italic">Description non disponible.</p>
        )}

        {offer.matchReasons.length > 0 ? (
          <section className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <h3 className="text-sm font-medium">Pourquoi ce match</h3>
            <ul className="space-y-1 text-xs">
              {offer.matchReasons.map((r) => (
                <li key={r.factor} className="flex items-center gap-2">
                  <span aria-hidden>{r.matched ? '✓' : '○'}</span>
                  <span className="flex-1">{r.label}</span>
                  <span className="text-neutral-500">{Math.round(r.value * 100)}%</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
          {offer.sourceUrl ? (
            <a
              href={offer.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 min-h-[40px]"
            >
              Voir l&apos;offre source ↗
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary-500 text-white px-4 py-2 text-sm font-medium hover:bg-primary-600 min-h-[40px]"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
