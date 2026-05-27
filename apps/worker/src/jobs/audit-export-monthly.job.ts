import { gzipSync } from 'node:zlib';
import type { Job } from 'bullmq';
import { and, asc, gte, lt } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { auditLogs } from '@swipejob/db/schema';
import { auditExportPayloadSchema, type AuditExportPayload } from '@swipejob/types';
import logger from '../lib/logger.js';
import { env } from '../lib/env.js';
import { buildAuditArchiveKey, uploadAuditArchive } from '../lib/r2-audit.js';

export type AuditExportResult =
  | {
      status: 'dry-run' | 'skipped-no-db' | 'skipped-no-r2';
      month: string;
      reason: string;
    }
  | {
      status: 'uploaded';
      month: string;
      key: string;
      bucket: string;
      rowCount: number;
      bytes: number;
    }
  | {
      status: 'failed';
      month: string;
      error: string;
    };

/**
 * Story 6.5 — Export mensuel `audit_logs` Postgres → R2 (archive froide CNIL 13 mois).
 *
 * Source canonique : la table Postgres `audit_logs` (et non Axiom, qui sert de stream temps réel).
 * Output : un fichier `.jsonl.gz` par mois sous `audit-archive/<YYYY>/<MM>/audit-<YYYY-MM>.jsonl.gz`.
 *
 * Le job est idempotent : ré-exécuter pour le même mois remplace le fichier R2.
 * Toggle via `AUDIT_EXPORT_ENABLED=true` (dry-run par défaut, cf. runbook).
 */
export async function processAuditExport(job: Job): Promise<AuditExportResult> {
  const payload: AuditExportPayload = auditExportPayloadSchema.parse(job.data);
  const log = logger.child({
    job: 'audit.export-monthly',
    jobId: job.id,
    month: payload.month,
  });

  log.info({ triggeredBy: payload.triggeredBy }, 'Audit export job started');

  if (!env.AUDIT_EXPORT_ENABLED) {
    log.warn('AUDIT_EXPORT_ENABLED=false — dry-run (no Postgres query, no R2 upload).');
    return { status: 'dry-run', month: payload.month, reason: 'AUDIT_EXPORT_ENABLED=false' };
  }

  if (!isDatabaseConfigured) {
    log.error('DATABASE_URL missing — cannot read audit_logs.');
    return { status: 'skipped-no-db', month: payload.month, reason: 'DATABASE_URL missing' };
  }

  const { startUtc, endUtc } = monthBounds(payload.month);

  try {
    const rows = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorType: auditLogs.actorType,
        event: auditLogs.event,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        ipHashed: auditLogs.ipHashed,
        userAgentHashed: auditLogs.userAgentHashed,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(and(gte(auditLogs.createdAt, startUtc), lt(auditLogs.createdAt, endUtc)))
      .orderBy(asc(auditLogs.createdAt));

    log.info({ rowCount: rows.length }, 'Fetched audit_logs rows for month');

    const jsonl = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length > 0 ? '\n' : '');
    const gzipped = gzipSync(Buffer.from(jsonl, 'utf8'));

    const key = buildAuditArchiveKey(payload.month);
    const upload = await uploadAuditArchive({ key, body: gzipped });
    if (!upload.ok) {
      log.error({ error: upload.error }, 'Upload R2 failed');
      if (upload.error === 'r2-not-configured') {
        return { status: 'skipped-no-r2', month: payload.month, reason: 'R2 credentials missing' };
      }
      return { status: 'failed', month: payload.month, error: upload.error };
    }

    log.info(
      { key: upload.key, bucket: upload.bucket, bytes: upload.bytes, rowCount: rows.length },
      'Audit archive uploaded',
    );
    return {
      status: 'uploaded',
      month: payload.month,
      key: upload.key,
      bucket: upload.bucket,
      rowCount: rows.length,
      bytes: upload.bytes,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err: message }, 'Audit export crashed');
    return { status: 'failed', month: payload.month, error: message };
  }
}

/** Retourne le range UTC du mois : `[YYYY-MM-01T00:00Z, (mois+1)-01T00:00Z[`. */
export function monthBounds(month: string): { startUtc: Date; endUtc: Date } {
  const [yearStr, monthStr] = month.split('-');
  if (!yearStr || !monthStr) throw new Error(`Invalid month: ${month}`);
  const year = Number(yearStr);
  const m = Number(monthStr);
  const startUtc = new Date(Date.UTC(year, m - 1, 1));
  const endUtc = new Date(Date.UTC(year, m, 1));
  return { startUtc, endUtc };
}
