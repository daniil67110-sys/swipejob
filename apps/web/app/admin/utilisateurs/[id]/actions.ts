'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@swipejob/db';
import { users } from '@swipejob/db/schema';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { enqueueAdminAnonymize } from '@/lib/queue';
import { serverLogger as logger } from '@/lib/logger.server';

/**
 * Story 8.4 — Server actions admin pour le détail utilisateur.
 *
 * Garde-fous communs (appliqués sur chaque action) :
 *  - `requireAdmin()` : 404 si non-admin.
 *  - Self-action interdite : un admin ne peut pas se modifier soi-même.
 *  - Audit log systématique avec `actorType=ADMIN` + `actorId=adminId`.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const ChangeRoleInput = z.object({
  userId: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']),
});

export async function changeUserRoleAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const adminId = session.user?.id;
  if (!adminId) return { ok: false, error: 'session_invalid' };

  const parsed = ChangeRoleInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };
  const { userId, role } = parsed.data;

  if (userId === adminId) {
    return { ok: false, error: 'cannot_modify_self' };
  }

  const existing = await db
    .select({ id: users.id, role: users.role, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = existing[0];
  if (!row) return { ok: false, error: 'user_not_found' };
  if (row.deletedAt) return { ok: false, error: 'user_soft_deleted' };
  if (row.role === role) return { ok: true };

  await db.update(users).set({ role }).where(eq(users.id, userId));

  await auditLog({
    actorId: adminId,
    actorType: 'ADMIN',
    event: 'admin.user.role_changed',
    targetType: 'user',
    targetId: userId,
    metadata: { from: row.role, to: role },
  });

  logger.info({ adminId, userId, from: row.role, to: role }, 'admin role change');
  revalidatePath(`/admin/utilisateurs/${userId}`);
  revalidatePath('/admin/utilisateurs');
  return { ok: true };
}

const AnonymizeInput = z.object({
  userId: z.string().min(1),
  confirmation: z.literal('ANONYMISER'),
});

export async function anonymizeUserAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const adminId = session.user?.id;
  if (!adminId) return { ok: false, error: 'session_invalid' };

  const parsed = AnonymizeInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input_or_confirmation' };
  const { userId } = parsed.data;

  if (userId === adminId) {
    return { ok: false, error: 'cannot_modify_self' };
  }

  const existing = await db
    .select({
      id: users.id,
      anonymizedAt: users.anonymizedAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = existing[0];
  if (!row) return { ok: false, error: 'user_not_found' };
  if (row.anonymizedAt) return { ok: false, error: 'already_anonymized' };
  if (row.purgedAt) return { ok: false, error: 'already_purged' };

  // Trace de l'intention AVANT enqueue (pour retrouver l'origine même si le
  // job échoue ou est rejoué). Le job écrira un second event `rgpd.anonymized_manual`
  // après exécution effective côté worker.
  await auditLog({
    actorId: adminId,
    actorType: 'ADMIN',
    event: 'admin.user.anonymize_requested',
    targetType: 'user',
    targetId: userId,
    metadata: { reason: 'admin_manual' },
  });

  const enqueue = await enqueueAdminAnonymize({ userId, triggeredByAdminId: adminId });
  if (!enqueue.ok) {
    logger.error({ adminId, userId, err: enqueue.error }, 'admin anonymize enqueue failed');
    return { ok: false, error: 'enqueue_failed' };
  }

  revalidatePath(`/admin/utilisateurs/${userId}`);
  revalidatePath('/admin/utilisateurs');
  return { ok: true };
}
