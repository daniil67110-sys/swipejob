import type { Metadata } from 'next';
import { AccessibilityReportsFilterBar } from '@/components/admin/AccessibilityReportsFilterBar';
import { AccessibilityReportsPagination } from '@/components/admin/AccessibilityReportsPagination';
import { AccessibilityReportsTable } from '@/components/admin/AccessibilityReportsTable';
import { listReports, parsePage, parseReportStatus } from '@/lib/admin/accessibility-reports';

export const metadata: Metadata = {
  title: 'Signalements accessibilité · Admin SwipeJob',
  robots: { index: false, follow: false },
};

/**
 * Story 8.5 — Liste des signalements accessibilité (RGAA / NFR-A7).
 *
 * Pas de cache : un nouveau signalement doit apparaître immédiatement.
 */
export const dynamic = 'force-dynamic';

type SearchParams = {
  status?: string;
  page?: string;
};

export default async function AdminAccessibilityReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = parseReportStatus(params.status);
  const page = parsePage(params.page);

  const result = await listReports({ status, page });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm font-display font-bold text-neutral-900">
          Signalements accessibilité
        </h1>
        <p className="mt-2 text-body-md text-neutral-600">
          Tickets remontés depuis la page publique{' '}
          <code className="text-body-sm bg-neutral-100 px-1.5 py-0.5 rounded">
            /declaration-accessibilite
          </code>
          . Traite chaque ticket : marque comme « pris en charge », « résolu » ou « hors scope »
          avec une note explicative.
        </p>
      </header>

      <AccessibilityReportsFilterBar
        currentStatus={status}
        counts={result.countsByStatus}
        total={Object.values(result.countsByStatus).reduce((a, b) => a + b, 0)}
      />

      <AccessibilityReportsTable rows={result.rows} />

      <AccessibilityReportsPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        preserved={{ status: status === 'all' ? undefined : status }}
      />
    </div>
  );
}
