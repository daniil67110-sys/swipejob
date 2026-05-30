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
      className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
    >
      <div className="h-1 bg-neutral-900" />
      <div className="space-y-4 p-5">
        <header className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-fraunces)] text-xl font-semibold leading-tight text-neutral-900">
              {items.length === 1 ? '1 lettre à relire' : `${items.length} lettres à relire`}{' '}
              <span className="italic text-neutral-400">avant envoi</span>
            </p>
            <p className="mt-1 text-body-sm text-neutral-600">
              Mode relecture activé — édite ta lettre puis valide l&apos;envoi.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDisableMode}
            disabled={disabling}
            className="hidden text-caption font-semibold text-neutral-500 transition-colors hover:text-neutral-900 hover:underline disabled:opacity-50 sm:inline"
            title="Désactiver le mode relecture (les prochaines candidatures partiront sans relecture)"
          >
            Désactiver
          </button>
        </header>

        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-[#f7f5f1] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-sm"
              >
                <CompanyLogo name={item.offer.companyName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {item.offer.companyName ?? 'Entreprise non précisée'}
                  </p>
                  <p className="truncate text-body-sm font-semibold text-neutral-900">
                    {item.offer.title}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-caption font-semibold text-white shadow-sm transition-all group-hover:bg-orange-500">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
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
          className="w-full py-2 text-caption font-semibold text-neutral-500 transition-colors hover:text-neutral-900 hover:underline disabled:opacity-50 sm:hidden"
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
