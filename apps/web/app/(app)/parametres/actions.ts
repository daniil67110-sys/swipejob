'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { preferences } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const updateSchema = z.object({
  pushEnabled: z.boolean().optional(),
  pushTime: z.string().regex(HHMM, 'Format HH:MM attendu').optional(),
  emailMarketingEnabled: z.boolean().optional(),
  emailDigestEnabled: z.boolean().optional(),
  emailDigestFrequency: z.enum(['weekly', 'never']).optional(),
  reviewBeforeSend: z.boolean().optional(),
});

export type NotificationSettingsInput = z.infer<typeof updateSchema>;

/**
 * Story 4.6 — Mettre à jour les préférences notifications.
 *
 * NB : `emailTransactionalEnabled` reste TRUE en V1 (RGPD : on doit pouvoir contacter
 * l'utilisateur pour les emails liés au compte). Désactivable V2 via consentement séparé.
 */
export async function updateNotificationSettingsAction(
  rawInput: NotificationSettingsInput,
): Promise<ActionResult<NotificationSettingsInput>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }

  const parsed = updateSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }
  const userId = session.user.id;

  const existing = await db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, userId))
    .limit(1);
  if (!existing[0]) {
    await db.insert(preferences).values({ userId, ...parsed.data });
  } else {
    await db
      .update(preferences)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(preferences.userId, userId));
  }

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'preferences.notifications_updated',
    targetType: 'preferences',
    targetId: userId,
    metadata: parsed.data as Record<string, unknown>,
  });

  captureServer('preferences.notifications_updated', hashUserId(userId), {
    keys: Object.keys(parsed.data),
  });

  return { ok: true, data: parsed.data };
}
