/**
 * Story 8.6 — Parsers de searchParams pour la liste audit logs.
 *
 * Extrait de `audit-logs.ts` (`server-only`) pour être testable en pur Node.
 */

export const PAGE_SIZE = 50;
export const EXPORT_MAX_ROWS = 10_000;

export type ActorTypeFilter = 'all' | 'USER' | 'ADMIN' | 'SYSTEM';

const ACTOR_TYPE_VALUES: readonly ActorTypeFilter[] = ['all', 'USER', 'ADMIN', 'SYSTEM'];

export function parseActorType(value: string | undefined): ActorTypeFilter {
  return ACTOR_TYPE_VALUES.includes(value as ActorTypeFilter) ? (value as ActorTypeFilter) : 'all';
}

export function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 10_000);
}

/**
 * Texte libre — on trim + on supprime les wildcards SQL (`%`, `_`) pour éviter
 * d'exploser les index quand un utilisateur tape un pattern.
 */
export function parseTextFilter(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, 200);
}

/**
 * Date ISO YYYY-MM-DD → Date UTC à minuit. Renvoie undefined si parse échoue.
 */
export function parseDateFilter(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}
