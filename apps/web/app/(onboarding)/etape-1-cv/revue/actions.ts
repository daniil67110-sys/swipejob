'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { profiles } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const editableSchema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  linkedinUrl: z
    .union([z.string().url(), z.literal(''), z.null(), z.undefined()])
    .transform((v) => (v ? String(v) : null)),
});

export async function updateProfileAction(rawInput: {
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  summary?: string | null;
  phone?: string | null;
  city?: string | null;
  linkedinUrl?: string | null;
}): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }

  const parsed = editableSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Champs invalides.' } };
  }
  const userId = session.user.id;

  try {
    await db
      .update(profiles)
      .set({
        firstName: parsed.data.firstName ?? null,
        lastName: parsed.data.lastName ?? null,
        headline: parsed.data.headline ?? null,
        summary: parsed.data.summary ?? null,
        phone: parsed.data.phone ?? null,
        city: parsed.data.city ?? null,
        linkedinUrl: parsed.data.linkedinUrl ?? null,
      })
      .where(eq(profiles.userId, userId));

    captureServer('profile.updated', hashUserId(userId), {
      fields: Object.keys(parsed.data).filter(
        (k) => parsed.data[k as keyof typeof parsed.data] != null,
      ),
    });
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'profile.field_updated',
      targetType: 'profile',
      targetId: userId,
      metadata: {
        fieldsUpdated: Object.keys(parsed.data),
      },
    });

    return { ok: true, data: { redirectTo: '/etape-2-preferences' } };
  } catch (err) {
    logger.error({ err, userId }, 'updateProfileAction failed');
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' } };
  }
}
