import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type UsersPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Search params à conserver dans les liens (q, status). */
  preserved: Record<string, string | undefined>;
};

function buildHref(preserved: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(preserved)) {
    if (v) params.set(k, v);
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/admin/utilisateurs?${qs}` : '/admin/utilisateurs';
}

export function UsersPagination({
  page,
  totalPages,
  total,
  pageSize,
  preserved,
}: UsersPaginationProps) {
  if (totalPages <= 1) {
    return (
      <p className="text-caption text-neutral-500">
        {total} résultat{total > 1 ? 's' : ''}
      </p>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination des utilisateurs"
      className="flex items-center justify-between gap-4"
    >
      <p className="text-caption text-neutral-500" aria-live="polite">
        {start}–{end} sur {total}
      </p>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link
            href={buildHref(preserved, page - 1)}
            rel="prev"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-body-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Précédent
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-100 bg-neutral-50 text-body-sm font-medium text-neutral-400 cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Précédent
          </span>
        )}
        <span className="text-caption text-neutral-500 tabular-nums">
          Page {page} / {totalPages}
        </span>
        {hasNext ? (
          <Link
            href={buildHref(preserved, page + 1)}
            rel="next"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-body-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Suivant
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-100 bg-neutral-50 text-body-sm font-medium text-neutral-400 cursor-not-allowed"
          >
            Suivant
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}
