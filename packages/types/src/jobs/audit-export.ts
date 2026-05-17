import { z } from 'zod';

export const auditExportPayloadSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'expected format YYYY-MM'),
  triggeredBy: z.enum(['cron', 'manual']).default('cron'),
});

export type AuditExportPayload = z.infer<typeof auditExportPayloadSchema>;

export const AUDIT_QUEUE_NAME = 'audit' as const;
export const AUDIT_EXPORT_JOB_NAME = 'export-monthly' as const;
export const AUDIT_EXPORT_CRON = '0 3 1 * *' as const; // 1st of month at 03:00 UTC
