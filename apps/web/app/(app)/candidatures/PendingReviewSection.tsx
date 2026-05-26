'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Sparkles } from 'lucide-react';
import { CompanyLogo } from '@/components/shared/CompanyLogo';
import { CoverLetterEditor } from './CoverLetterEditor';
import { toggleReviewBeforeSendAction, type PendingReviewApplication } from './actions';

type Props = {
  items: PendingReviewApplication[];
};

/**
 * Story 3.7 — Section bannière en tête de /candidatures listant les lettres
 * à relire. Clic sur un item → ouvre le drawer `<CoverLetterEditor>`.
 */
export function PendingReviewSection({ items }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [disabling, startDisable] = useTransition();
  if (items.length === 0) return null;
  const selected = items.find((it) => it.id === selectedId) ?? null;

  const handleDisableMode = () => {
    startDisable(async () => {
      await toggleReviewBeforeSendAction({ enabled: false });
      router.refresh();
    });
  };

  return (
    <section
      aria-label="Lettres en attente de relecture"
      className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-info-100"
    >
      <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-accent-500" />
      <div className="p-5 space-y-4">
        <header className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-info-500 to-primary-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-heading-sm font-semibold text-neutral-900">
              {items.length === 1
                ? '1 lettre à relire avant envoi'
                : `${items.length} lettres à relire avant envoi`}
            </p>
            <p className="text-body-sm text-neutral-600 mt-0.5">
              Mode relecture activé — édite ta lettre puis valide l&apos;envoi.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDisableMode}
            disabled={disabling}
            className="hidden sm:inline text-caption font-medium text-neutral-500 hover:text-neutral-900 hover:underline transition-colors disabled:opacity-50"
            title="Désactiver le mode relecture (les prochaines candidatures partiront sans relecture)"
          >
            Désactiver le mode
          </button>
        </header>

        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className="w-full group flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-info-200 hover:bg-info-50/40 transition-all text-left"
              >
                <CompanyLogo name={item.offer.companyName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold">
                    {item.offer.companyName ?? 'Entreprise non précisée'}
                  </p>
                  <p className="text-body-sm font-semibold text-neutral-900 truncate">
                    {item.offer.title}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-500 to-primary-500 text-white text-caption font-semibold shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  Relire
                </span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleDisableMode}
          disabled={disabling}
          className="sm:hidden w-full text-caption font-medium text-neutral-500 hover:text-neutral-900 hover:underline transition-colors disabled:opacity-50 py-2"
        >
          Désactiver le mode relecture
        </button>
      </div>

      {selected ? (
        <CoverLetterEditor
          application={selected}
          open={Boolean(selectedId)}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </section>
  );
}
