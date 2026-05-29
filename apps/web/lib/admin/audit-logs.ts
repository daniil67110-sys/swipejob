import 'server-only';
import { and, asc, count, desc, eq, gte, ilike, lt, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@swipejob/db';
import { auditLogs } from '@swipejob/db/schema';
import { EXPORT_MAX_ROWS, PAGE_SIZE, type ActorTypeFilter } from './audit-logs-params';

export {
  EXPORT_MAX_ROWS,
  PAGE_SIZE,
  parseActorType,
  parseDateFilter,
  parsePage,
  parseTextFilter,
  type ActorTypeFilter,
} from './audit-logs-params';

/**
 * Story 8.6 — Liste paginée + export CSV des audit logs (Story 6.5).
 *
 * Filtres supportés : `actorType`, `event` (LIKE), `targetType` (LIKE),
 * `actorId` (exact), `dateFrom`/`dateTo` (UTC). Tri par `createdAt DESC` par
 * défaut. La table peut être très large (1M+ rows en année 2) — V1 OFFSET
 * suffit mais cap les pages explorables à éviter timeouts.
 *
 * Export CSV : même filtre, capé à `EXPORT_MAX_ROWS` (10k). Si la sélection
 * dépasse, l'admin doit affiner. Le download lui-même produit un audit log
 * `admin.audit_logs.exported` (méta-audit RGPD).
 */

export type AuditLogActorType = 'USER' | 'ADMIN' | 'SYSTEM';

export type AuditLogFilters = {
  actorType?: ActorTypeFilter;
  event?: string;
  targetType?: string;
  actorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type AuditLogRow = {
  id: string;
  createdAt: Date;
  actorType: AuditLogActorType;
  actorId: string | null;
  event: string;
  targetType: string | null;
  targetId: string | null;
  ipHashed: string | null;
  userAgentHashed: string | null;
  metadata: Record<string, unknown> | null;
};

export type AuditLogsListResult = {
  rows: AuditLogRow[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
};

/**
 * Construit la clause WHERE depuis les filtres. Exposé pour réutilisation par
 * la route d'export CSV (qui n'utilise pas la pagination mais le même filtre).
 */
export function buildAuditLogsWhere(filters: AuditLogFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (filters.actorType && filters.actorType !== 'all') {
    conditions.push(eq(auditLogs.actorType, filters.actorType));
  }
  if (filters.event) {
    conditions.push(ilike(auditLogs.event, `%${filters.event}%`));
  }
  if (filters.targetType) {
    conditions.push(ilike(auditLogs.targetType, `%${filters.targetType}%`));
  }
  if (filters.actorId) {
    conditions.push(eq(auditLogs.actorId, filters.actorId));
  }
  if (filters.dateFrom) {
    conditions.push(gte(auditLogs.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    // dateTo est inclusif sur la journée → on prend `< dateTo + 1 jour`.
    const exclusiveEnd = new Date(filters.dateTo);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    conditions.push(lt(auditLogs.createdAt, exclusiveEnd));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listAuditLogs(input: {
  filters: AuditLogFilters;
  page?: number;
}): Promise<AuditLogsListResult> {
  const page = Math.max(1, input.page ?? 1);
  const whereClause = buildAuditLogsWhere(input.filters);

  const [totalRow] = await db.select({ n: count() }).from(auditLogs).where(whereClause);
  const total = totalRow?.n ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Pattern défensif Drizzle : `createdAt` en `sql<string>` + re-parse en Date,
  // par cohérence avec `users-list.ts` (cf. memory feedback-drizzle-raw-sql-dates).
  const rawRows = await db
    .select({
      id: auditLogs.id,
      createdAt: sql<string>`${auditLogs.createdAt}`,
      actorType: auditLogs.actorType,
      actorId: auditLogs.actorId,
      event: auditLogs.event,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      ipHashed: auditLogs.ipHashed,
      userAgentHashed: auditLogs.userAgentHashed,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE);

  const rows: AuditLogRow[] = rawRows.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }));

  return {
    rows,
    total,
    page: safePage,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Stream des rows pour l'export CSV : tri ASC pour itérer chronologiquement,
 * limité à `EXPORT_MAX_ROWS`. Le caller doit warn si `rows.length === MAX` →
 * sélection probable plus large que ce que l'export peut couvrir.
 */
export async function fetchAuditLogsForExport(filters: AuditLogFilters): Promise<AuditLogRow[]> {
  const whereClause = buildAuditLogsWhere(filters);
  const rawRows = await db
    .select({
      id: auditLogs.id,
      createdAt: sql<string>`${auditLogs.createdAt}`,
      actorType: auditLogs.actorType,
      actorId: auditLogs.actorId,
      event: auditLogs.event,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      ipHashed: auditLogs.ipHashed,
      userAgentHashed: auditLogs.userAgentHashed,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .where(whereClause)
    .orderBy(asc(auditLogs.createdAt))
    .limit(EXPORT_MAX_ROWS);
  return rawRows.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }));
}
