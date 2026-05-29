import { type NextRequest, NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit';
import { requireAdmin } from '@/lib/auth';
import {
  EXPORT_MAX_ROWS,
  fetchAuditLogsForExport,
  parseActorType,
  parseDateFilter,
  parseTextFilter,
  type AuditLogFilters,
} from '@/lib/admin/audit-logs';
import { rowsToCsv } from '@/lib/admin/audit-logs-csv';
import { serverLogger as logger } from '@/lib/logger.server';

/**
 * Story 8.6 — Export CSV des audit logs filtrés.
 *
 * - Auth admin obligatoire (sinon 404 via `requireAdmin`).
 * - Mêmes filtres que la page liste (`?event=...&actorType=...&...`).
 * - Cap à `EXPORT_MAX_ROWS` (10k). Si saturé, le header
 *   `X-Audit-Export-Truncated: true` signale qu'il y a probablement plus de
 *   résultats — affiner les filtres.
 * - Méta-audit RGPD : un event `admin.audit_logs.exported` est inséré APRÈS
 *   succès, avec metadata = { filters, count }.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  const adminId = session.user?.id;
  if (!adminId) {
    return NextResponse.json({ error: 'session_invalid' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const filters: AuditLogFilters = {
    actorType: parseActorType(sp.get('actorType') ?? undefined),
    event: parseTextFilter(sp.get('event') ?? undefined),
    targetType: parseTextFilter(sp.get('targetType') ?? undefined),
    actorId: parseTextFilter(sp.get('actorId') ?? undefined),
    dateFrom: parseDateFilter(sp.get('dateFrom') ?? undefined),
    dateTo: parseDateFilter(sp.get('dateTo') ?? undefined),
  };

  try {
    const rows = await fetchAuditLogsForExport(filters);
    const csv = rowsToCsv(rows);
    const truncated = rows.length === EXPORT_MAX_ROWS;

    const today = new Date().toISOString().slice(0, 10);
    const filename = `audit_logs_${today}.csv`;

    await auditLog({
      actorId: adminId,
      actorType: 'ADMIN',
      event: 'admin.audit_logs.exported',
      targetType: 'audit_logs',
      metadata: {
        count: rows.length,
        truncated,
        filters: {
          actorType: filters.actorType,
          event: filters.event ?? null,
          targetType: filters.targetType ?? null,
          actorId: filters.actorId ?? null,
          dateFrom: filters.dateFrom?.toISOString() ?? null,
          dateTo: filters.dateTo?.toISOString() ?? null,
        },
      },
    });

    logger.info({ adminId, count: rows.length, truncated }, 'admin audit logs CSV export');

    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'no-store',
        'x-audit-export-truncated': truncated ? 'true' : 'false',
      },
    });
  } catch (err) {
    logger.error({ err, adminId }, 'audit logs CSV export failed');
    return NextResponse.json({ error: 'export_failed' }, { status: 500 });
  }
}
