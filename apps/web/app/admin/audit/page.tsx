import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { AuditLogsFilterBar } from '@/components/admin/AuditLogsFilterBar';
import { AuditLogsPagination } from '@/components/admin/AuditLogsPagination';
import { AuditLogsTable } from '@/components/admin/AuditLogsTable';
import {
  EXPORT_MAX_ROWS,
  listAuditLogs,
  parseActorType,
  parseDateFilter,
  parsePage,
  parseTextFilter,
  type AuditLogFilters,
} from '@/lib/admin/audit-logs';

export const metadata: Metadata = {
  title: 'Journal audit · Admin SwipeJob',
  robots: { index: false, follow: false },
};

/**
 * Story 8.6 — Journal d'audit append-only (Story 6.5).
 *
 * Pas de cache : un audit log fraîchement écrit doit apparaître immédiatement.
 */
export const dynamic = 'force-dynamic';

type SearchParams = {
  event?: string;
  targetType?: string;
  actorType?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const actorType = parseActorType(params.actorType);
  const event = parseTextFilter(params.event);
  const targetType = parseTextFilter(params.targetType);
  const actorId = parseTextFilter(params.actorId);
  const dateFrom = parseDateFilter(params.dateFrom);
  const dateTo = parseDateFilter(params.dateTo);
  const page = parsePage(params.page);

  const filters: AuditLogFilters = {
    actorType,
    event,
    targetType,
    actorId,
    dateFrom,
    dateTo,
  };

  const result = await listAuditLogs({ filters, page });

  // Reconstruit la query string pour les liens (pagination + export).
  const preserved: Record<string, string | undefined> = {
    event,
    targetType,
    actorId,
    actorType: actorType === 'all' ? undefined : actorType,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  const exportQuery = new URLSearchParams();
  for (const [k, v] of Object.entries(preserved)) {
    if (v) exportQuery.set(k, v);
  }
  const exportHref = exportQuery.toString()
    ? `/admin/audit/export?${exportQuery.toString()}`
    : '/admin/audit/export';

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-display-sm font-display font-bold text-neutral-900">Journal audit</h1>
          <p className="mt-2 text-body-md text-neutral-600">
            Trace append-only des actions sensibles (RGPD, modération, auth). IP et user-agent sont
            hashés HMAC-SHA256 (Story 6.5).
          </p>
        </div>
        <a
          href={exportHref}
          download
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-body-sm font-semibold hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-info-300"
          aria-label={`Télécharger l'export CSV (jusqu'à ${EXPORT_MAX_ROWS.toLocaleString('fr-FR')} lignes max)`}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Exporter CSV
        </a>
      </header>

      <AuditLogsFilterBar
        defaults={{
          actorType,
          event,
          targetType,
          actorId,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
        }}
      />

      <AuditLogsTable rows={result.rows} />

      <AuditLogsPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        preserved={preserved}
      />
    </div>
  );
}
