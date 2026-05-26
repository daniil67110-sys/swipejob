import 'server-only';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/lib/db';
import { applications, swipeEvents, userBadges } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { computeUserStreak } from '@/lib/streaks';

/**
 * Story 5.2 — catalogue des badges + logique de déblocage.
 *
 * Le catalogue est versionné en code : modifier la liste = bump conscient.
 * Pas de modif rétroactive sur les unlocks existants (UNIQUE(userId, code)
 * empêche les doublons et le created_at reflète le moment d'origine).
 */

export type BadgeCategory = 'milestone' | 'streak' | 'volume';

export type BadgeDef = {
  code: string;
  title: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  /** Couleur thématique (Tailwind suffix : 'primary' | 'success' | 'info' | 'accent' | 'warning'). */
  color: 'primary' | 'success' | 'info' | 'accent' | 'warning';
};

export const BADGE_CATALOG: readonly BadgeDef[] = [
  {
    code: 'first_swipe',
    title: 'Premier swipe',
    description: 'Tu as fait ton premier choix dans le deck.',
    emoji: '👆',
    category: 'milestone',
    color: 'info',
  },
  {
    code: 'first_application',
    title: 'Première candidature',
    description: 'Tu as envoyé ta première candidature.',
    emoji: '📨',
    category: 'milestone',
    color: 'primary',
  },
  {
    code: 'first_reply',
    title: 'Première réponse',
    description: 'Une entreprise t’a répondu pour la première fois.',
    emoji: '💬',
    category: 'milestone',
    color: 'info',
  },
  {
    code: 'first_interview',
    title: 'Premier entretien',
    description: 'Tu as décroché ton premier entretien.',
    emoji: '🎤',
    category: 'milestone',
    color: 'accent',
  },
  {
    code: 'first_signature',
    title: 'Première signature',
    description: 'Tu as signé ton premier contrat. Bravo !',
    emoji: '🎉',
    category: 'milestone',
    color: 'success',
  },
  {
    code: 'streak_7',
    title: 'Streak 7 jours',
    description: 'Sept jours d’affilée à chercher : la régularité paie.',
    emoji: '🔥',
    category: 'streak',
    color: 'accent',
  },
  {
    code: 'streak_30',
    title: 'Streak 30 jours',
    description: 'Trente jours consécutifs. Tu es en feu.',
    emoji: '🚀',
    category: 'streak',
    color: 'primary',
  },
  {
    code: 'apps_10',
    title: '10 candidatures',
    description: 'Tu as franchi le cap des dix candidatures envoyées.',
    emoji: '🔟',
    category: 'volume',
    color: 'info',
  },
  {
    code: 'apps_50',
    title: '50 candidatures',
    description: 'Cinquante candidatures. La persévérance incarnée.',
    emoji: '💯',
    category: 'volume',
    color: 'success',
  },
] as const;

export type BadgeCode = (typeof BADGE_CATALOG)[number]['code'];

export function getBadgeDef(code: string): BadgeDef | undefined {
  return BADGE_CATALOG.find((b) => b.code === code);
}

/**
 * Recalcule l'état des unlocks pour cet utilisateur et insère les nouveaux
 * badges. Retourne la liste des badges fraîchement débloqués cette fois-ci.
 * Idempotent : si tous les unlocks existent déjà, retourne [].
 *
 * À appeler après chaque action significative (swipe right, status update, etc.).
 */
export async function checkAndUnlockBadges(userId: string): Promise<BadgeDef[]> {
  if (!isDatabaseConfigured) return [];

  // 1. Snapshot des unlocks déjà acquis
  const existingRows = await db
    .select({ badgeCode: userBadges.badgeCode })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  const acquired = new Set(existingRows.map((r) => r.badgeCode));

  // Pas la peine d'aller chercher des stats si tout est déjà débloqué.
  if (acquired.size >= BADGE_CATALOG.length) return [];

  // 2. Stats requises pour évaluer les critères
  const [swipeStats] = await db
    .select({ swipes: count() })
    .from(swipeEvents)
    .where(eq(swipeEvents.userId, userId));
  const totalSwipes = Number(swipeStats?.swipes ?? 0);

  const [appStats] = await db
    .select({ apps: count() })
    .from(applications)
    .where(
      and(eq(applications.userId, userId), sql`${applications.status} != 'cancelled_by_user'`),
    );
  const totalApplications = Number(appStats?.apps ?? 0);

  const milestoneStatuses: Array<'replied' | 'interview_scheduled' | 'signed'> = [
    'replied',
    'interview_scheduled',
    'signed',
  ];
  const milestoneRows = await db
    .select({ status: applications.status })
    .from(applications)
    .where(and(eq(applications.userId, userId), inArray(applications.status, milestoneStatuses)));
  const hasReply = milestoneRows.some((r) =>
    ['replied', 'interview_scheduled', 'signed'].includes(r.status),
  );
  const hasInterview = milestoneRows.some((r) =>
    ['interview_scheduled', 'signed'].includes(r.status),
  );
  const hasSignature = milestoneRows.some((r) => r.status === 'signed');

  const streakNeeded = ['streak_7', 'streak_30'].some((c) => !acquired.has(c));
  const streak = streakNeeded ? await computeUserStreak(userId) : { current: 0, longest: 0 };

  // 3. Évalue chaque badge
  const toUnlock: BadgeDef[] = [];
  const consider = (code: BadgeCode, condition: boolean) => {
    if (condition && !acquired.has(code)) {
      const def = getBadgeDef(code);
      if (def) toUnlock.push(def);
    }
  };

  consider('first_swipe', totalSwipes >= 1);
  consider('first_application', totalApplications >= 1);
  consider('first_reply', hasReply);
  consider('first_interview', hasInterview);
  consider('first_signature', hasSignature);
  consider('streak_7', streak.longest >= 7);
  consider('streak_30', streak.longest >= 30);
  consider('apps_10', totalApplications >= 10);
  consider('apps_50', totalApplications >= 50);

  if (toUnlock.length === 0) return [];

  // 4. Insert
  await db
    .insert(userBadges)
    .values(toUnlock.map((b) => ({ userId, badgeCode: b.code })))
    .onConflictDoNothing();

  // 5. Audit + analytics
  for (const badge of toUnlock) {
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'badge.unlocked',
      targetType: 'user_badge',
      targetId: badge.code,
      metadata: { code: badge.code, title: badge.title },
    });
    captureServer('badge.unlocked', hashUserId(userId), { badge_code: badge.code });
  }

  return toUnlock;
}

export async function listUserBadges(
  userId: string,
): Promise<Array<BadgeDef & { unlockedAt: Date | null }>> {
  if (!isDatabaseConfigured) {
    return BADGE_CATALOG.map((b) => ({ ...b, unlockedAt: null }));
  }
  const rows = await db
    .select({ badgeCode: userBadges.badgeCode, unlockedAt: userBadges.unlockedAt })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  const map = new Map(rows.map((r) => [r.badgeCode, r.unlockedAt]));
  return BADGE_CATALOG.map((b) => ({ ...b, unlockedAt: map.get(b.code) ?? null }));
}
