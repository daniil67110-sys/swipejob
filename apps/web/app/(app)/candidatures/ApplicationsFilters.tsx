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
    <div className="space-y-4">
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
                'rounded-full px-3.5 py-1.5 text-caption font-medium transition ' +
                (active
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
              }
            >
              {statusLabel(s)}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-caption text-neutral-500">
          Trier par
        </label>
        <div className="relative">
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-md border border-neutral-200 bg-white pl-3 pr-8 py-1.5 text-caption font-medium text-neutral-700 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
