import 'server-only';
import { and, count, desc, ilike, isNotNull, isNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@swipejob/db';
import { sessions, users } from '@swipejob/db/schema';
import { PAGE_SIZE, type UserStatusFilter } from './users-list-params';

export {
  PAGE_SIZE,
  SEARCH_MIN_LENGTH,
  parsePage,
  parseSearchQuery,
  parseUserStatus,
  type UserStatusFilter,
} from './users-list-params';

/**
 * Story 8.3 — Liste paginée des utilisateurs pour l'admin.
 *
 * Recherche : ILIKE %q% sur email (citext → insensible à la casse). Min 2 chars
 * pour éviter les requêtes triviales qui scannent toute la table.
 *
 * Statut : tri par couches mutuellement exclusives (un user anonymisé n'est
 * jamais "actif") :
 *  - active : deleted_at IS NULL AND anonymized_at IS NULL
 *  - anonymized : anonymized_at IS NOT NULL
 *  - deleted : deleted_at IS NOT NULL AND purged_at IS NULL
 *  - all : pas de filtre
 *
 * Pagination : OFFSET/LIMIT. Suffisant en V1 (< 10k users attendus en beta).
 * Si la table grossit > 100k, basculer en cursor-based sur created_at.
 */

export type UsersListInput = {
  q?: string;
  status?: UserStatusFilter;
  page?: number;
};

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  deletedAt: Date | null;
  anonymizedAt: Date | null;
  purgedAt: Date | null;
  lastSeenAt: Date | null;
};

export type UsersListResult = {
  rows: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
};

function statusCondition(status: UserStatusFilter): SQL | undefined {
  switch (status) {
    case 'active':
      return and(isNull(users.deletedAt), isNull(users.anonymizedAt));
    case 'anonymized':
      return isNotNull(users.anonymizedAt);
    case 'deleted':
      return and(isNotNull(users.deletedAt), isNull(users.purgedAt));
    case 'all':
    default:
      return undefined;
  }
}

export async function listUsers(input: UsersListInput): Promise<UsersListResult> {
  const status = input.status ?? 'all';
  const page = Math.max(1, input.page ?? 1);
  const q = input.q;

  const conditions: SQL[] = [];
  const statusCond = statusCondition(status);
  if (statusCond) conditions.push(statusCond);
  if (q) conditions.push(ilike(users.email, `%${q}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ n: count() }).from(users).where(whereClause);
  const total = totalRow?.n ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
      anonymizedAt: users.anonymizedAt,
      purgedAt: users.purgedAt,
      // Dernière activité = max(sessions.lastSeenAt) — null si jamais connecté
      lastSeenAt: sql<Date | null>`(
        SELECT MAX(${sessions.lastSeenAt})
        FROM ${sessions}
        WHERE ${sessions.userId} = ${users.id}
      )`,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE);

  return {
    rows,
    total,
    page: safePage,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
