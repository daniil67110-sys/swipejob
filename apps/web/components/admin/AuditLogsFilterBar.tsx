import type { ActorTypeFilter } from '@/lib/admin/audit-logs';

const ACTOR_TYPE_OPTIONS: Array<{ value: ActorTypeFilter; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'USER', label: 'Utilisateur' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SYSTEM', label: 'Système' },
];

export type AuditLogsFilterBarProps = {
  defaults: {
    actorType: ActorTypeFilter;
    event?: string;
    targetType?: string;
    actorId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

/**
 * Story 8.6 — Form GET de filtres audit logs. Pas de client component : les
 * filtres passent dans l'URL → SSR-friendly + partageables.
 */
export function AuditLogsFilterBar({ defaults }: AuditLogsFilterBarProps) {
  return (
    <form
      method="get"
      action="/admin/audit"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      role="search"
      aria-label="Filtrer les audit logs"
    >
      <div>
        <label
          htmlFor="audit-event"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold mb-1"
        >
          Événement (contient)
        </label>
        <input
          id="audit-event"
          type="search"
          name="event"
          defaultValue={defaults.event ?? ''}
          placeholder="rgpd.anonymized"
          maxLength={200}
          autoComplete="off"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300"
        />
      </div>

      <div>
        <label
          htmlFor="audit-target-type"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold mb-1"
        >
          Cible (contient)
        </label>
        <input
          id="audit-target-type"
          type="search"
          name="targetType"
          defaultValue={defaults.targetType ?? ''}
          placeholder="user, accessibility_report…"
          maxLength={200}
          autoComplete="off"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300"
        />
      </div>

      <div>
        <label
          htmlFor="audit-actor-id"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold mb-1"
        >
          Actor ID (exact)
        </label>
        <input
          id="audit-actor-id"
          type="search"
          name="actorId"
          defaultValue={defaults.actorId ?? ''}
          placeholder="user_xxx"
          maxLength={200}
          autoComplete="off"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300"
        />
      </div>

      <div>
        <label
          htmlFor="audit-actor-type"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold mb-1"
        >
          Type acteur
        </label>
        <select
          id="audit-actor-type"
          name="actorType"
          defaultValue={defaults.actorType}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300"
        >
          {ACTOR_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="audit-date-from"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold mb-1"
        >
          Du
        </label>
        <input
          id="audit-date-from"
          type="date"
          name="dateFrom"
          defaultValue={defaults.dateFrom ?? ''}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300"
        />
      </div>

      <div>
        <label
          htmlFor="audit-date-to"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold mb-1"
        >
          Au (inclus)
        </label>
        <input
          id="audit-date-to"
          type="date"
          name="dateTo"
          defaultValue={defaults.dateTo ?? ''}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300"
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
        <button
          type="submit"
          className="rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-body-sm font-semibold hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-info-300"
        >
          Filtrer
        </button>
        <a
          href="/admin/audit"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Réinitialiser
        </a>
      </div>
    </form>
  );
}
