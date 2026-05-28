import { Search } from 'lucide-react';
import type { UserStatusFilter } from '@/lib/admin/users-list';

const STATUS_OPTIONS: Array<{ value: UserStatusFilter; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'anonymized', label: 'Anonymisés' },
  { value: 'deleted', label: 'Suppression demandée' },
];

export type UsersFilterBarProps = {
  defaultQ?: string;
  defaultStatus?: UserStatusFilter;
};

/**
 * Story 8.3 — Form GET de filtres pour la liste utilisateurs.
 *
 * Pas de client component : un form HTML standard suffit, l'action est la même
 * page (paramètres dans l'URL) → SSR-friendly + état préservé via URL = partageable.
 */
export function UsersFilterBar({ defaultQ = '', defaultStatus = 'all' }: UsersFilterBarProps) {
  return (
    <form
      method="get"
      action="/admin/utilisateurs"
      className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
      role="search"
      aria-label="Rechercher et filtrer les utilisateurs"
    >
      <div className="flex-1">
        <label
          htmlFor="users-search"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold mb-1"
        >
          Recherche email
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="users-search"
            type="search"
            name="q"
            defaultValue={defaultQ}
            placeholder="oksana@gmail.com"
            minLength={2}
            maxLength={120}
            autoComplete="off"
            className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="users-status"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold mb-1"
        >
          Statut
        </label>
        <select
          id="users-status"
          name="status"
          defaultValue={defaultStatus}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-body-sm font-semibold hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-info-300"
      >
        Filtrer
      </button>
    </form>
  );
}
