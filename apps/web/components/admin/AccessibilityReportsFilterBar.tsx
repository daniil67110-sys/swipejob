import type { ReportStatusFilter } from '@/lib/admin/accessibility-reports';

const STATUS_OPTIONS: Array<{ value: ReportStatusFilter; label: string; tone: string }> = [
  { value: 'all', label: 'Tous', tone: 'bg-neutral-900 text-white' },
  { value: 'open', label: 'Ouverts', tone: 'bg-warning-100 text-warning-800' },
  { value: 'acknowledged', label: 'En cours', tone: 'bg-info-100 text-info-800' },
  { value: 'resolved', label: 'Résolus', tone: 'bg-success-100 text-success-800' },
  { value: 'wontfix', label: 'Hors scope', tone: 'bg-neutral-100 text-neutral-700' },
];

export type AccessibilityReportsFilterBarProps = {
  currentStatus: ReportStatusFilter;
  counts: Record<'open' | 'acknowledged' | 'resolved' | 'wontfix', number>;
  total: number;
};

/**
 * Story 8.5 — Pills de filtre statut. Liens GET vers la même page → SSR pur,
 * pas de client component requis.
 */
export function AccessibilityReportsFilterBar({
  currentStatus,
  counts,
  total,
}: AccessibilityReportsFilterBarProps) {
  return (
    <nav
      aria-label="Filtrer les signalements par statut"
      className="flex flex-wrap items-center gap-2"
    >
      {STATUS_OPTIONS.map((option) => {
        const isActive = currentStatus === option.value;
        const n =
          option.value === 'all' ? total : (counts[option.value as keyof typeof counts] ?? 0);
        const href =
          option.value === 'all'
            ? '/admin/signalements'
            : `/admin/signalements?status=${option.value}`;
        return (
          <a
            key={option.value}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-body-sm font-medium ring-1 transition-colors ${
              isActive
                ? `${option.tone} ring-transparent`
                : 'bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <span>{option.label}</span>
            <span
              className={`tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {n}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
