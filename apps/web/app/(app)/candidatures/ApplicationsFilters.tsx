'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { statusLabel, type ApplicationStatus } from './lib';

const FILTERABLE: ApplicationStatus[] = [
  'sent',
  'read',
  'replied',
  'interview_scheduled',
  'signed',
  'rejected',
  'pending_review',
];

const SORT_OPTIONS: Array<{
  value: 'last_activity_desc' | 'sent_desc' | 'sent_asc';
  label: string;
}> = [
  { value: 'last_activity_desc', label: 'Activité récente' },
  { value: 'sent_desc', label: 'Plus récent' },
  { value: 'sent_asc', label: 'Plus ancien' },
];

export function ApplicationsFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const activeStatuses = useMemo(() => {
    const raw = params.get('statuses');
    return raw ? new Set(raw.split(',')) : new Set<string>();
  }, [params]);

  const sort = params.get('sort') ?? 'last_activity_desc';

  const toggleStatus = useCallback(
    (s: ApplicationStatus) => {
      const next = new Set(activeStatuses);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      const sp = new URLSearchParams(params.toString());
      if (next.size === 0) sp.delete('statuses');
      else sp.set('statuses', Array.from(next).join(','));
      router.push(`/candidatures?${sp.toString()}`);
    },
    [activeStatuses, params, router],
  );

  const setSort = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(params.toString());
      sp.set('sort', value);
      router.push(`/candidatures?${sp.toString()}`);
    },
    [params, router],
  );

  return (
    <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERABLE.map((s) => {
          const active = activeStatuses.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              aria-pressed={active}
              className={
                'rounded-full px-3.5 py-1.5 text-caption font-semibold transition-all ' +
                (active
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-[#f7f5f1] text-neutral-700 ring-1 ring-neutral-200 hover:bg-white hover:ring-neutral-300')
              }
            >
              {statusLabel(s)}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
        <label
          htmlFor="sort"
          className="text-caption font-semibold uppercase tracking-[0.14em] text-neutral-500"
        >
          Trier par
        </label>
        <div className="relative">
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-full border border-neutral-200 bg-[#f7f5f1] py-1.5 pl-4 pr-9 text-caption font-semibold text-neutral-800 transition-colors hover:border-neutral-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
