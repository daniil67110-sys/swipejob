/**
 * Story 8.2 — Helpers de fenêtres temporelles pour les KPIs admin.
 *
 * Extrait du module `kpis.ts` (`server-only`) pour être testable en pur Node sans
 * passer par l'environnement RSC.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysAgo(days: number, ref: Date = new Date()): Date {
  return new Date(ref.getTime() - days * MS_PER_DAY);
}
