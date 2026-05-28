import 'server-only';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@swipejob/db';
import {
  applications,
  auditLogs,
  cvs,
  profiles,
  rgpdExports,
  sessions,
  swipeEvents,
  userConsents,
  users,
} from '@swipejob/db/schema';

/**
 * Story 8.4 — Chargement complet du détail d'un utilisateur pour l'admin.
 *
 * Toutes les sections sont récupérées en Promise.all. Pas de cache : on veut
 * la vérité fraîche sur une page de modération (un soft-delete passé il y a
 * 2 secondes doit apparaître immédiatement).
 */

export type UserDetailIdentity = {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  source: string;
  locale: string;
  birthDate: Date | null;
  consentStatus: string;
  emailVerified: Date | null;
  createdAt: Date;
};

export type UserDetailRgpdStatus = {
  deletedAt: Date | null;
  anonymizedAt: Date | null;
  purgedAt: Date | null;
  inactivityNotifiedAt: Date | null;
};

export type UserDetailActivity = {
  activeSessions: number;
  totalSwipes: number;
  totalApplications: number;
  applicationsSent: number;
  cvCount: number;
  rgpdExportsCount: number;
  lastSeenAt: Date | null;
  lastSwipeAt: Date | null;
  lastApplicationAt: Date | null;
};

export type UserDetailAuditEntry = {
  id: string;
  event: string;
  actorType: 'USER' | 'ADMIN' | 'SYSTEM';
  createdAt: Date;
  metadata: Record<string, unknown> | null;
};

export type UserDetailProfile = {
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  headline: string | null;
} | null;

export type UserConsentRow = {
  id: string;
  purpose: string;
  granted: boolean;
  createdAt: Date;
};

export type UserDetail = {
  identity: UserDetailIdentity;
  profile: UserDetailProfile;
  rgpdStatus: UserDetailRgpdStatus;
  activity: UserDetailActivity;
  auditLogs: UserDetailAuditEntry[];
  consents: UserConsentRow[];
};

async function loadIdentity(
  userId: string,
): Promise<{ identity: UserDetailIdentity; rgpdStatus: UserDetailRgpdStatus } | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      source: users.source,
      locale: users.locale,
      birthDate: users.birthDate,
      consentStatus: users.consentStatus,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
      anonymizedAt: users.anonymizedAt,
      purgedAt: users.purgedAt,
      inactivityNotifiedAt: users.inactivityNotifiedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const birth = row.birthDate ? new Date(`${row.birthDate}T00:00:00Z`) : null;
  return {
    identity: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      source: row.source,
      locale: row.locale,
      birthDate: birth,
      consentStatus: row.consentStatus,
      emailVerified: row.emailVerified,
      createdAt: row.createdAt,
    },
    rgpdStatus: {
      deletedAt: row.deletedAt,
      anonymizedAt: row.anonymizedAt,
      purgedAt: row.purgedAt,
      inactivityNotifiedAt: row.inactivityNotifiedAt,
    },
  };
}

async function loadProfile(userId: string): Promise<UserDetailProfile> {
  const rows = await db
    .select({
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      city: profiles.city,
      headline: profiles.headline,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

async function loadActivity(userId: string): Promise<UserDetailActivity> {
  const now = new Date();
  const [
    [sessionsRow],
    [swipesRow],
    [applicationsRow],
    [applicationsSentRow],
    [cvsRow],
    [exportsRow],
    [lastSeenRow],
    [lastSwipeRow],
    [lastApplicationRow],
  ] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), gte(sessions.expires, now))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(swipeEvents)
      .where(eq(swipeEvents.userId, userId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(applications)
      .where(eq(applications.userId, userId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.status, 'sent'))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(cvs)
      .where(eq(cvs.userId, userId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(rgpdExports)
      .where(eq(rgpdExports.userId, userId)),
    db
      .select({ at: sql<Date | null>`max(${sessions.lastSeenAt})` })
      .from(sessions)
      .where(eq(sessions.userId, userId)),
    db
      .select({ at: sql<Date | null>`max(${swipeEvents.swipedAt})` })
      .from(swipeEvents)
      .where(eq(swipeEvents.userId, userId)),
    db
      .select({ at: sql<Date | null>`max(${applications.sentAt})` })
      .from(applications)
      .where(eq(applications.userId, userId)),
  ]);
  return {
    activeSessions: sessionsRow?.n ?? 0,
    totalSwipes: swipesRow?.n ?? 0,
    totalApplications: applicationsRow?.n ?? 0,
    applicationsSent: applicationsSentRow?.n ?? 0,
    cvCount: cvsRow?.n ?? 0,
    rgpdExportsCount: exportsRow?.n ?? 0,
    lastSeenAt: lastSeenRow?.at ?? null,
    lastSwipeAt: lastSwipeRow?.at ?? null,
    lastApplicationAt: lastApplicationRow?.at ?? null,
  };
}

async function loadAuditLogs(userId: string): Promise<UserDetailAuditEntry[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      event: auditLogs.event,
      actorType: auditLogs.actorType,
      createdAt: auditLogs.createdAt,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .where(eq(auditLogs.targetId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);
  return rows.map((r) => ({
    id: r.id,
    event: r.event,
    actorType: r.actorType,
    createdAt: r.createdAt,
    metadata: r.metadata,
  }));
}

async function loadConsents(userId: string): Promise<UserConsentRow[]> {
  // userConsents est append-only (Story 6.2) — on liste les 10 derniers
  // events. Reconstituer le statut par purpose serait `DISTINCT ON` côté SQL
  // ; on garde simple ici (l'admin verra l'historique brut).
  const rows = await db
    .select({
      id: userConsents.id,
      purpose: userConsents.purpose,
      granted: userConsents.granted,
      createdAt: userConsents.createdAt,
    })
    .from(userConsents)
    .where(eq(userConsents.userId, userId))
    .orderBy(desc(userConsents.createdAt))
    .limit(10);
  return rows;
}

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const identityRow = await loadIdentity(userId);
  if (!identityRow) return null;

  const [profile, activity, auditLogsRows, consents] = await Promise.all([
    loadProfile(userId),
    loadActivity(userId),
    loadAuditLogs(userId),
    loadConsents(userId),
  ]);

  return {
    identity: identityRow.identity,
    profile,
    rgpdStatus: identityRow.rgpdStatus,
    activity,
    auditLogs: auditLogsRows,
    consents,
  };
}
