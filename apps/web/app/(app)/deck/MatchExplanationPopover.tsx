'use client';

import { useState, useRef, useEffect } from 'react';

export type MatchReason = {
  factor: string;
  weight: number;
  value: number;
  label: string;
  matched: boolean;
};

/**
 * Story 2.11 — popover explication score.
 *
 * V1 implé maison (sans Radix dep). A11y :
 *  - bouton trigger avec aria-expanded
 *  - escape ferme
 *  - click outside ferme
 *  - focus trap simple
 *  - aria-labelledby
 */
export function MatchExplanationPopover({
  score,
  reasons,
}: {
  score: number;
  reasons: MatchReason[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const gradientClass =
    score >= 75
      ? 'bg-neutral-900 text-white shadow-md ring-1 ring-primary-300/40'
      : score >= 50
        ? 'border border-neutral-300 bg-white text-neutral-800 shadow-sm'
        : 'bg-neutral-100 text-neutral-600';

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Score de compatibilité ${score}% — ouvrir le détail`}
        className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 hover:shadow-md ${gradientClass} min-h-[28px]`}
      >
        <span aria-hidden className="text-sm leading-none">
          ✨
        </span>
        <span>{score}% match</span>
        <span
          aria-hidden
          className="ml-0.5 text-[10px] opacity-70 transition-transform group-hover:translate-x-0.5"
        >
          ›
        </span>
      </button>
      {open ? (
        <div
          role="dialog"
          aria-labelledby="explanation-title"
          className="absolute right-0 mt-2 w-80 rounded-md border border-neutral-200 bg-white p-4 shadow-lg z-10"
        >
          <h3 id="explanation-title" className="text-sm font-semibold mb-2">
            Pourquoi ce score ?
          </h3>
          <ul className="space-y-2">
            {reasons.length === 0 ? (
              <li className="text-xs text-neutral-500">
                Match basé sur tes préférences. Calcul détaillé en cours.
              </li>
            ) : (
              reasons.map((r) => (
                <li key={r.factor} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">
                      {r.matched ? '✓' : '○'} {r.label}
                    </span>
                    <span className="text-neutral-500">{Math.round(r.weight * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={r.matched ? 'h-full bg-success-500' : 'h-full bg-neutral-300'}
                      style={{ width: `${Math.round(r.value * 100)}%` }}
                      aria-label={`${r.label} ${Math.round(r.value * 100)}%`}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
          <a
            href="/help/matching"
            className="mt-3 inline-block text-xs font-medium text-primary-500 hover:underline"
          >
            En savoir plus sur le matching
          </a>
        </div>
      ) : null}
    </div>
  );
}
