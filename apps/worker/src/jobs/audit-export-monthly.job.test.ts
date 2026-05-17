import { describe, expect, it } from 'vitest';
import type { Job } from 'bullmq';
import { processAuditExport } from './audit-export-monthly.job.js';

function fakeJob(data: unknown): Job {
  return { id: 'test-job', data } as unknown as Job;
}

describe('processAuditExport', () => {
  it('returns dry-run when AUDIT_EXPORT_ENABLED is false (default)', async () => {
    const result = await processAuditExport(fakeJob({ month: '2026-04', triggeredBy: 'manual' }));
    expect(result.status).toBe('dry-run');
    expect(result.month).toBe('2026-04');
    expect(result.dryRunReason).toContain('AUDIT_EXPORT_ENABLED');
  });

  it('rejects invalid month format via Zod', async () => {
    await expect(
      processAuditExport(fakeJob({ month: 'not-a-month', triggeredBy: 'manual' })),
    ).rejects.toThrow(/expected format YYYY-MM/);
  });

  it('defaults triggeredBy to cron when omitted', async () => {
    const result = await processAuditExport(fakeJob({ month: '2026-04' }));
    expect(result.month).toBe('2026-04');
    expect(result.status).toBe('dry-run');
  });
});
