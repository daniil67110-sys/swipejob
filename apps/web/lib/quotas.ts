import 'server-only';
import { computeAge, categorizeAge } from './age';

export const ADULT_DAILY_QUOTA = 20;
export const MINOR_DAILY_QUOTA = 5;

/**
 * Quota quotidien de swipes droits (FR-SA9, NFR-CP minor protection).
 *
 * - Mineur 13-17 : quota réduit (5/jour) pour limiter l'usage compulsif.
 * - Majeur : quota standard (20/jour).
 * - birthDate null : quota 0 (defensive — user n'a pas terminé /onboarding/age).
 *
 * Sera consommé par Story 3.9 (swipe quota enforcement).
 */
export function getSwipeQuota(user: { birthDate: Date | string | null }): number {
  if (!user.birthDate) return 0;
  const birthDate = user.birthDate instanceof Date ? user.birthDate : new Date(user.birthDate);
  const category = categorizeAge(computeAge(birthDate));
  switch (category) {
    case 'under_13':
      return 0;
    case 'minor':
      return MINOR_DAILY_QUOTA;
    case 'adult':
      return ADULT_DAILY_QUOTA;
  }
}
