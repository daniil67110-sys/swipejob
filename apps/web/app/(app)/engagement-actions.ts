'use server';

import { auth } from '@/lib/auth';
import { captureServer, hashUserId } from '@/lib/analytics';
import { computeUserStreak, type StreakData } from '@/lib/streaks';
import { listUserBadges, type BadgeDef } from '@/lib/badges';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

/** Story 5.1 — récupère le streak du user courant pour rendre le chip + heatmap. */
export async function getMyStreakAction(): Promise<ActionResult<StreakData>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  const data = await computeUserStreak(session.user.id);
  return { ok: true, data };
}

/** Story 5.1 — tracking quand l'utilisateur ouvre la bottom sheet du streak. */
export async function trackStreakViewedAction(input: {
  current: number;
}): Promise<ActionResult<{ tracked: true }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  captureServer('streak.viewed', hashUserId(session.user.id), {
    current: input.current,
  });
  return { ok: true, data: { tracked: true } };
}

/** Story 5.2 — liste des badges du user (débloqués + locked du catalogue). */
export async function getMyBadgesAction(): Promise<
  ActionResult<{ badges: Array<BadgeDef & { unlockedAt: Date | null }> }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  const badges = await listUserBadges(session.user.id);
  return { ok: true, data: { badges } };
}
