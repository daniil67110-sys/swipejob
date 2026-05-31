'use client';

import { useEffect } from 'react';
import { Briefcase, ExternalLink, MapPin, X } from 'lucide-react';
import { CompanyLogo } from '@/components/shared/CompanyLogo';
import { ShareOfferMenu } from '@/components/engagement/ShareOfferMenu';
import { buildOfferUrl } from '@/lib/offer-slug';
import type { SwipeCardData } from './SwipeCard';

type Props = {
  offer: SwipeCardData;
  siteUrl: string;
  onClose: () => void;
};

/**
 * Story 3.3 + 5.4 — modal détail offre.
 * - Escape ferme. Click outside ferme.
 * - Bouton de partage anonymisé Story 5.4 dans le footer.
 */
export function OfferDetailModal({ offer, siteUrl, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shareUrl = buildOfferUrl(siteUrl, offer.title, offer.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`offer-detail-${offer.id}`}
      className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative rounded-2xl bg-white max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="h-1.5 bg-neutral-900 shrink-0" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow-md ring-1 ring-neutral-200 flex items-center justify-center text-neutral-700 hover:scale-105 hover:ring-orange-200 active:scale-95 transition-all z-10"
        >
          <X className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
        </button>

        <div className="overflow-auto flex-1">
          <header className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <div className="flex items-start gap-3 pr-12">
              <CompanyLogo name={offer.companyName} logoUrl={offer.companyLogoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-caption uppercase tracking-wider text-neutral-500 font-semibold">
                  {offer.companyName ?? 'Entreprise non précisée'}
                </p>
                <h2
                  id={`offer-detail-${offer.id}`}
                  className="text-heading-md font-semibold text-neutral-900 leading-tight"
                >
                  {offer.title}
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {offer.locationCity ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-caption font-semibold">
                      <MapPin className="w-3 h-3" aria-hidden="true" />
                      {offer.locationCity}
                    </span>
                  ) : null}
                  {offer.contractType ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-caption font-semibold">
                      <Briefcase className="w-3 h-3" aria-hidden="true" />
                      {offer.contractType}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <div className="px-6 py-4 space-y-4">
            {offer.description ? (
              <div className="text-body-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                {offer.description}
              </div>
            ) : (
              <p className="text-body-sm text-neutral-500 italic">Description non disponible.</p>
            )}

            {offer.matchReasons.length > 0 ? (
              <section className="space-y-2 rounded-2xl border border-neutral-200 bg-[#f7f5f1] p-4">
                <h3 className="text-body-sm font-semibold text-neutral-900">Pourquoi ce match</h3>
                <ul className="space-y-1.5 text-caption">
                  {offer.matchReasons.map((r) => (
                    <li key={r.factor} className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          r.matched ? 'bg-orange-500' : 'bg-neutral-300'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-neutral-700">{r.label}</span>
                      <span className="text-neutral-500 tabular-nums font-medium">
                        {Math.round(r.value * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50 shrink-0">
          <ShareOfferMenu
            offerId={offer.id}
            offerTitle={offer.title}
            offerCompany={offer.companyName}
            url={shareUrl}
          />
          {offer.sourceUrl ? (
            <a
              href={offer.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-body-sm font-semibold text-neutral-700 hover:border-orange-200 hover:bg-orange-50 transition-all min-h-[40px]"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Source
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 text-white px-4 py-2 text-body-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all min-h-[40px]"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
