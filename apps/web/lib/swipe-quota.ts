import 'server-only';
import { and, eq, gte, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from './db';
import { applications, users } from '@swipejob/db/schema';
import { computeAge, categorizeAge } from './age';

// Story 3.9 — quotas configurables. V1 hardcoded, V2 = feature flag.
export const QUOTA = {
  freeMinor: 5,
  freeMajor: 20,
  premium: 50,
} as const;

/**
 * Retourne le quota quotidien d'un user :
 *  - mineur (13-17) → 5
 *  - majeur free → 20
 *  - premium → 50 (V2 — V1 pas implémenté, défault free)
 */
export async function getDailyQuota(userId: string): Promise<number> {
  if (!isDatabaseConfigured) return QUOTA.freeMajor;
  const rows = await db
    .select({ birthDate: users.birthDate })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const u = rows[0];
  if (!u?.birthDate) return QUOTA.freeMajor;
  const birth = typeof u.birthDate === 'string' ? new Date(u.birthDate) : (u.birthDate as Date);
  const cat = categorizeAge(computeAge(birth));
  if (cat === 'minor') return QUOTA.freeMinor;
  return QUOTA.freeMajor;
}

/**
 * Compte les candidatures envoyées ou pending depuis minuit Europe/Paris.
 * V1 simple : UTC start of day. V2 = timezone EU Paris exact.
 */
export async function countTodayApplications(userId: string): Promise<number> {
  if (!isDatabaseConfigured) return 0;
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        gte(applications.createdAt, startOfDay),
        sql`${applications.status} != 'cancelled_by_user'`,
      ),
    );
  return rows[0]?.count ?? 0;
}

export async function isOverQuota(userId: string): Promise<boolean> {
  const [quota, used] = await Promise.all([getDailyQuota(userId), countTodayApplications(userId)]);
  return used >= quota;
}
