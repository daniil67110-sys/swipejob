import 'server-only';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/lib/db';
import { applications, users } from '@swipejob/db/schema';

/**
 * Story 5.5 — Wrapped stats à la signature.
 *
 * On lit l'application signée (avec ses snapshots) puis on agrège quelques
 * compteurs sur tout le parcours du user (toutes les apps non-cancelled, pas
 * juste celle qui a été signée).
 */

export type WrappedData = {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  signedAt: Date;
  /** Jours entre user.createdAt et signedAt. */
  searchDurationDays: number;
  /** Nombre total de candidatures envoyées (status != cancelled). */
  applicationsSent: number;
  /** Nombre d'entretiens décrochés (interview_scheduled OU signed). */
  interviewsScheduled: number;
};

export async function getWrappedData(input: {
  applicationId: string;
  userId: string;
}): Promise<WrappedData | null> {
  if (!isDatabaseConfigured) return null;

  const appRows = await db
    .select({
      id: applications.id,
      status: applications.status,
      signedAt: applications.signedAt,
      signedCompany: applications.signedCompanySnapshot,
      signedJobTitle: applications.signedJobTitleSnapshot,
      userCreatedAt: users.createdAt,
    })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.userId))
    .where(and(eq(applications.id, input.applicationId), eq(applications.userId, input.userId)))
    .limit(1);
  const app = appRows[0];
  if (!app || app.status !== 'signed' || !app.signedAt) return null;

  const [appsStats] = await db
    .select({ n: count() })
    .from(applications)
    .where(
      and(
        eq(applications.userId, input.userId),
        sql`${applications.status} != 'cancelled_by_user'`,
        sql`${applications.status} != 'pending_letter'`,
        sql`${applications.status} != 'pending_review'`,
      ),
    );

  const [interviewStats] = await db
    .select({ n: count() })
    .from(applications)
    .where(
      and(
        eq(applications.userId, input.userId),
        inArray(applications.status, ['interview_scheduled', 'signed']),
      ),
    );

  const ms = app.signedAt.getTime() - app.userCreatedAt.getTime();
  const searchDurationDays = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));

  return {
    applicationId: app.id,
    companyName: app.signedCompany ?? 'cette entreprise',
    jobTitle: app.signedJobTitle ?? 'mon nouveau poste',
    signedAt: app.signedAt,
    searchDurationDays,
    applicationsSent: Number(appsStats?.n ?? 0),
    interviewsScheduled: Number(interviewStats?.n ?? 0),
  };
}
