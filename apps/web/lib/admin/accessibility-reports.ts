import 'server-only';
import { count, desc, eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@swipejob/db';
import { accessibilityReports } from '@swipejob/db/schema';
import { PAGE_SIZE, type ReportStatusFilter } from './accessibility-reports-params';

export {
  PAGE_SIZE,
  parsePage,
  parseReportStatus,
  type ReportStatusFilter,
} from './accessibility-reports-params';

/**
 * Story 8.5 — Liste paginée + détail des signalements accessibilité.
 *
 * La table est append côté public (Story 6.8). Côté admin on lit + on mute
 * `status` + `adminNotes` via Server Action (cf. `[id]/actions.ts`).
 *
 * Pagination OFFSET (suffisant tant qu'on a < 10k tickets). Pas de recherche
 * texte en V1 — l'admin filtre uniquement par statut.
 */

export type ReportStatus = 'open' | 'acknowledged' | 'resolved' | 'wontfix';

export type ReportListRow = {
  id: string;
  url: string;
  status: ReportStatus;
  hasContact: boolean;
  createdAt: Date;
};

export type ReportListResult = {
  rows: ReportListRow[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  countsByStatus: Record<ReportStatus, number>;
};

export type ReportDetail = {
  id: string;
  url: string;
  description: string;
  contactEmail: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  reporterIpHashed: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function statusCondition(status: ReportStatusFilter): SQL | undefined {
  if (status === 'all') return undefined;
  return eq(accessibilityReports.status, status);
}

export async function listReports(input: {
  status?: ReportStatusFilter;
  page?: number;
}): Promise<ReportListResult> {
  const status = input.status ?? 'all';
  const page = Math.max(1, input.page ?? 1);
  const whereClause = statusCondition(status);

  // Compteurs par statut (toujours afficher les 4 badges, indépendamment du filtre).
  const countsRows = await db
    .select({
      status: accessibilityReports.status,
      n: count(),
    })
    .from(accessibilityReports)
    .groupBy(accessibilityReports.status);
  const countsByStatus: Record<ReportStatus, number> = {
    open: 0,
    acknowledged: 0,
    resolved: 0,
    wontfix: 0,
  };
  for (const row of countsRows) {
    countsByStatus[row.status] = row.n;
  }

  const [totalRow] = await db.select({ n: count() }).from(accessibilityReports).where(whereClause);
  const total = totalRow?.n ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Note Drizzle : on type `createdAt` en `sql<string>` puis on re-parse en Date
  // par cohérence avec le pattern défensif appliqué côté `users-list.ts`
  // (cf. memory feedback-drizzle-raw-sql-dates). Pas de subquery raw ici donc
  // pas obligatoire, mais on garde le pattern par sécurité.
  const rawRows = await db
    .select({
      id: accessibilityReports.id,
      url: accessibilityReports.url,
      status: accessibilityReports.status,
      hasContact: sql<boolean>`(${accessibilityReports.contactEmail} IS NOT NULL)`,
      createdAt: sql<string>`${accessibilityReports.createdAt}`,
    })
    .from(accessibilityReports)
    .where(whereClause)
    .orderBy(desc(accessibilityReports.createdAt))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE);

  const rows: ReportListRow[] = rawRows.map((r) => ({
    id: r.id,
    url: r.url,
    status: r.status,
    hasContact: Boolean(r.hasContact),
    createdAt: new Date(r.createdAt),
  }));

  return {
    rows,
    total,
    page: safePage,
    totalPages,
    pageSize: PAGE_SIZE,
    countsByStatus,
  };
}

export async function getReportById(id: string): Promise<ReportDetail | null> {
  const rows = await db
    .select({
      id: accessibilityReports.id,
      url: accessibilityReports.url,
      description: accessibilityReports.description,
      contactEmail: accessibilityReports.contactEmail,
      status: accessibilityReports.status,
      adminNotes: accessibilityReports.adminNotes,
      reporterIpHashed: accessibilityReports.reporterIpHashed,
      createdAt: accessibilityReports.createdAt,
      updatedAt: accessibilityReports.updatedAt,
    })
    .from(accessibilityReports)
    .where(eq(accessibilityReports.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
