'use server';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { pushSubscriptions } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { headers } from 'next/headers';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1024),
  p256dh: z.string().min(8).max(256),
  auth: z.string().min(8).max(256),
});

/**
 * Story 4.4 — register a Web Push subscription for the current user.
 * Conflit endpoint : update au lieu d'insert (upsert).
 */
export async function subscribePushAction(rawInput: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }

  const parsed = subscribeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }

  const hdrs = await headers();
  const userAgent = hdrs.get('user-agent') ?? null;
  const userId = session.user.id;

  const existing = await db
    .select({ id: pushSubscriptions.id, userId: pushSubscriptions.userId })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, parsed.data.endpoint))
    .limit(1);

  let id: string;
  if (existing[0]) {
    id = existing[0].id;
    await db
      .update(pushSubscriptions)
      .set({
        userId,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pushSubscriptions.id, id));
  } else {
    const inserted = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
        userAgent,
      })
      .returning({ id: pushSubscriptions.id });
    id = inserted[0]!.id;
  }

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'push.subscribed',
    targetType: 'push_subscription',
    targetId: id,
  });

  return { ok: true, data: { id } };
}

export async function unsubscribePushAction(
  endpoint: string,
): Promise<ActionResult<{ removed: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  if (typeof endpoint !== 'string' || endpoint.length === 0 || endpoint.length > 1024) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Endpoint invalide.' } };
  }
  const userId = session.user.id;
  const res = await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
    .returning({ id: pushSubscriptions.id });

  if (res.length > 0) {
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'push.unsubscribed',
      targetType: 'push_subscription',
      targetId: res[0]!.id,
    });
  }

  return { ok: true, data: { removed: res.length } };
}
