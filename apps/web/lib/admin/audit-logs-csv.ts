import type { AuditLogRow } from './audit-logs';

/**
 * Encode une valeur en champ CSV (RFC 4180) :
 *  - null/undefined → chaîne vide
 *  - contient `,`, `"`, `\n` ou `\r` → quoter et échapper les `"` en `""`
 *  - sinon → valeur brute
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = [
  'id',
  'created_at',
  'actor_type',
  'actor_id',
  'event',
  'target_type',
  'target_id',
  'ip_hashed',
  'user_agent_hashed',
  'metadata',
] as const;

export function rowsToCsv(rows: AuditLogRow[]): string {
  const header = CSV_HEADERS.join(',');
  const lines: string[] = [header];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.createdAt.toISOString(),
        row.actorType,
        row.actorId,
        row.event,
        row.targetType,
        row.targetId,
        row.ipHashed,
        row.userAgentHashed,
        row.metadata ? JSON.stringify(row.metadata) : null,
      ]
        .map(escapeCsvField)
        .join(','),
    );
  }
  return lines.join('\n');
}
