/**
 * Story 8.3 — Parsers de searchParams pour la liste utilisateurs.
 *
 * Extrait du module `users-list.ts` (`server-only`) pour être testable en pur
 * Node sans passer par l'environnement RSC.
 */

export const PAGE_SIZE = 20;
export const SEARCH_MIN_LENGTH = 2;

export type UserStatusFilter = 'all' | 'active' | 'anonymized' | 'deleted';

const STATUS_VALUES: readonly UserStatusFilter[] = ['all', 'active', 'anonymized', 'deleted'];

export function parseUserStatus(value: string | undefined): UserStatusFilter {
  return STATUS_VALUES.includes(value as UserStatusFilter) ? (value as UserStatusFilter) : 'all';
}

export function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 10_000);
}

export function parseSearchQuery(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length < SEARCH_MIN_LENGTH) return undefined;
  return trimmed;
}
