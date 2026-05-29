'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@swipejob/db';
import { accessibilityReports } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { requireAdmin } from '@/lib/auth';
import { serverLogger as logger } from '@/lib/logger.server';

/**
 * Story 8.5 — Server actions admin pour traiter un signalement accessibilité.
 *
 * - `requireAdmin()` : 404 si non-admin.
 * - Toute mutation produit un audit log (actorType=ADMIN, targetType=accessibility_report).
 * - `adminNotes` est optionnel et limité à 4000 chars (cohérent avec la
 *   description côté formulaire public Story 6.8).
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const ReportStatusEnum = z.enum(['open', 'acknowledged', 'resolved', 'wontfix']);

const UpdateStatusInput = z.object({
  reportId: z.string().min(1),
  status: ReportStatusEnum,
});

export async function updateReportStatusAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const adminId = session.user?.id;
  if (!adminId) return { ok: false, error: 'session_invalid' };

  const parsed = UpdateStatusInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };
  const { reportId, status } = parsed.data;

  const existing = await db
    .select({ id: accessibilityReports.id, status: accessibilityReports.status })
    .from(accessibilityReports)
    .where(eq(accessibilityReports.id, reportId))
    .limit(1);
  const row = existing[0];
  if (!row) return { ok: false, error: 'report_not_found' };
  if (row.status === status) return { ok: true };

  await db
    .update(accessibilityReports)
    .set({ status })
    .where(eq(accessibilityReports.id, reportId));

  await auditLog({
    actorId: adminId,
    actorType: 'ADMIN',
    event: 'admin.accessibility_report.status_changed',
    targetType: 'accessibility_report',
    targetId: reportId,
    metadata: { from: row.status, to: status },
  });

  logger.info(
    { adminId, reportId, from: row.status, to: status },
    'admin a11y report status change',
  );
  revalidatePath(`/admin/signalements/${reportId}`);
  revalidatePath('/admin/signalements');
  return { ok: true };
}

const UpdateNotesInput = z.object({
  reportId: z.string().min(1),
  notes: z.string().max(4000),
});

export async function updateReportNotesAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const adminId = session.user?.id;
  if (!adminId) return { ok: false, error: 'session_invalid' };

  const parsed = UpdateNotesInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };
  const { reportId, notes } = parsed.data;

  const existing = await db
    .select({ id: accessibilityReports.id, adminNotes: accessibilityReports.adminNotes })
    .from(accessibilityReports)
    .where(eq(accessibilityReports.id, reportId))
    .limit(1);
  const row = existing[0];
  if (!row) return { ok: false, error: 'report_not_found' };

  const trimmed = notes.trim();
  const nextValue = trimmed.length === 0 ? null : trimmed;
  if (row.adminNotes === nextValue) return { ok: true };

  await db
    .update(accessibilityReports)
    .set({ adminNotes: nextValue })
    .where(eq(accessibilityReports.id, reportId));

  await auditLog({
    actorId: adminId,
    actorType: 'ADMIN',
    event: 'admin.accessibility_report.notes_updated',
    targetType: 'accessibility_report',
    targetId: reportId,
    metadata: { hadNotes: row.adminNotes !== null, hasNotes: nextValue !== null },
  });

  logger.info({ adminId, reportId }, 'admin a11y report notes updated');
  revalidatePath(`/admin/signalements/${reportId}`);
  return { ok: true };
}
