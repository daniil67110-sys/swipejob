/**
 * Story 8.5 — Parsers de searchParams pour la liste des signalements accessibilité.
 *
 * Extrait du module `accessibility-reports.ts` (`server-only`) pour être
 * testable en pur Node sans environnement RSC.
 */

export const PAGE_SIZE = 20;

export type ReportStatusFilter = 'all' | 'open' | 'acknowledged' | 'resolved' | 'wontfix';

const STATUS_VALUES: readonly ReportStatusFilter[] = [
  'all',
  'open',
  'acknowledged',
  'resolved',
  'wontfix',
];

export function parseReportStatus(value: string | undefined): ReportStatusFilter {
  return STATUS_VALUES.includes(value as ReportStatusFilter)
    ? (value as ReportStatusFilter)
    : 'all';
}

export function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 10_000);
}
