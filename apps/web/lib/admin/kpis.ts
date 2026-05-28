import 'server-only';
import { and, count, countDistinct, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm';
import { db } from '@swipejob/db';
import {
  accessibilityReports,
  applications,
  auditLogs,
  rgpdExports,
  sessions,
  swipeEvents,
  users,
} from '@swipejob/db/schema';
import { daysAgo } from './date-windows';

/**
 * Story 8.2 — KPIs santé app pour le dashboard admin.
 *
 * Queries Postgres-only, agrégées via Promise.all pour un round-trip unique.
 * Aucun accès Redis/BullMQ ici : le module reste server-only RSC-friendly.
 *
 * Les fenêtres temporelles sont calculées côté Node (`daysAgo` extrait dans
 * `date-windows.ts` pour testabilité hors RSC).
 */

export type UserKpis = {
  totalActive: number;
  signupsLast7d: number;
  anonymized: number;
  softDeletedPendingPurge: number;
};

export type ActivityKpis = {
  sessionsLast24h: number;
  swipesLast7d: number;
  applicationsSentLast7d: number;
};

export type ComplianceKpis = {
  rgpdExportsPending: number;
  accessibilityReportsOpen: number;
  auditEventsLast24h: number;
};

export type AdminKpis = {
  users: UserKpis;
  activity: ActivityKpis;
  compliance: ComplianceKpis;
  generatedAt: string;
};

async function scalarCount(query: Promise<Array<{ n: number }>>): Promise<number> {
  const rows = await query;
  return rows[0]?.n ?? 0;
}

async function getUserKpis(now: Date): Promise<UserKpis> {
  const since7d = daysAgo(7, now);

  const [totalActive, signupsLast7d, anonymized, softDeletedPendingPurge] = await Promise.all([
    scalarCount(
      db
        .select({ n: count() })
        .from(users)
        .where(and(isNull(users.deletedAt), isNull(users.anonymizedAt))),
    ),
    scalarCount(
      db
        .select({ n: count() })
        .from(users)
        .where(and(gte(users.createdAt, since7d), isNull(users.deletedAt))),
    ),
    scalarCount(db.select({ n: count() }).from(users).where(isNotNull(users.anonymizedAt))),
    scalarCount(
      db
        .select({ n: count() })
        .from(users)
        .where(and(isNotNull(users.deletedAt), isNull(users.purgedAt))),
    ),
  ]);

  return { totalActive, signupsLast7d, anonymized, softDeletedPendingPurge };
}

async function getActivityKpis(now: Date): Promise<ActivityKpis> {
  const since24h = daysAgo(1, now);
  const since7d = daysAgo(7, now);

  const [sessionsLast24h, swipesLast7d, applicationsSentLast7d] = await Promise.all([
    scalarCount(
      db
        .select({ n: countDistinct(sessions.userId).as('n') })
        .from(sessions)
        .where(and(gte(sessions.lastSeenAt, since24h), gte(sessions.expires, now))),
    ),
    scalarCount(
      db.select({ n: count() }).from(swipeEvents).where(gte(swipeEvents.swipedAt, since7d)),
    ),
    scalarCount(
      db
        .select({ n: count() })
        .from(applications)
        .where(and(isNotNull(applications.sentAt), gte(applications.sentAt, since7d))),
    ),
  ]);

  return { sessionsLast24h, swipesLast7d, applicationsSentLast7d };
}

async function getComplianceKpis(now: Date): Promise<ComplianceKpis> {
  const since24h = daysAgo(1, now);

  const [rgpdExportsPending, accessibilityReportsOpen, auditEventsLast24h] = await Promise.all([
    scalarCount(
      db.select({ n: count() }).from(rgpdExports).where(eq(rgpdExports.status, 'pending')),
    ),
    scalarCount(
      db
        .select({ n: count() })
        .from(accessibilityReports)
        .where(eq(accessibilityReports.status, 'open')),
    ),
    scalarCount(
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, since24h)),
    ),
  ]);

  return { rgpdExportsPending, accessibilityReportsOpen, auditEventsLast24h };
}

/**
 * Récupère les 3 sections de KPIs en parallèle (un round-trip global).
 * Le timestamp `generatedAt` permet à l'UI d'afficher la fraîcheur.
 */
export async function getAdminKpis(): Promise<AdminKpis> {
  const now = new Date();
  const [usersKpis, activityKpis, complianceKpis] = await Promise.all([
    getUserKpis(now),
    getActivityKpis(now),
    getComplianceKpis(now),
  ]);
  return {
    users: usersKpis,
    activity: activityKpis,
    compliance: complianceKpis,
    generatedAt: now.toISOString(),
  };
}
