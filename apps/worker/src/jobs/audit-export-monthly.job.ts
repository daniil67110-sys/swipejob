import type { Job } from 'bullmq';
import { auditExportPayloadSchema, type AuditExportPayload } from '@swipejob/types';
import logger from '../lib/logger.js';
import { env } from '../lib/env.js';

export type AuditExportResult = {
  status: 'dry-run' | 'uploaded' | 'skipped-no-token';
  month: string;
  uploadedKey?: string;
  dryRunReason?: string;
};

export async function processAuditExport(job: Job): Promise<AuditExportResult> {
  const payload: AuditExportPayload = auditExportPayloadSchema.parse(job.data);
  const log = logger.child({
    job: 'audit.export-monthly',
    jobId: job.id,
    month: payload.month,
  });

  log.info({ triggeredBy: payload.triggeredBy }, 'Audit export job started');

  if (!env.AUDIT_EXPORT_ENABLED) {
    log.warn('AUDIT_EXPORT_ENABLED is false — running in dry-run mode (no R2 upload).');
    return {
      status: 'dry-run',
      month: payload.month,
      dryRunReason: 'AUDIT_EXPORT_ENABLED=false',
    };
  }

  if (!env.AXIOM_TOKEN) {
    log.error('AUDIT_EXPORT_ENABLED=true but AXIOM_TOKEN missing — cannot query audit dataset.');
    return {
      status: 'skipped-no-token',
      month: payload.month,
      dryRunReason: 'AXIOM_TOKEN missing',
    };
  }

  // V1 placeholder: real Axiom→R2 export not yet wired (Story 6.5).
  // See docs/runbooks/audit-export.md for the full procedure.
  log.warn(
    'AUDIT_EXPORT_ENABLED=true mais implémentation Axiom→R2 non câblée (Story 6.5). Aucun upload effectué.',
  );

  return {
    status: 'dry-run',
    month: payload.month,
    dryRunReason: 'Real Axiom→R2 export pending Story 6.5',
  };
}
