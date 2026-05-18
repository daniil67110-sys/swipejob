'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { users } from '@swipejob/db/schema';
import { computeAge, categorizeAge } from '@/lib/age';
import { auditLog } from '@/lib/audit';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const birthSchema = z.object({
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format YYYY-MM-DD attendu)')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Date invalide')
    .refine((s) => new Date(s) < new Date(), 'La date doit être dans le passé')
    .refine(
      (s) => new Date(s) > new Date(Date.now() - 120 * 365 * 24 * 3600 * 1000),
      'Date trop ancienne',
    ),
});

export async function submitBirthDateAction(rawInput: {
  birthDate: string;
}): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  const parsed = birthSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Date invalide.' },
    };
  }
  const birthDate = new Date(parsed.data.birthDate);
  const age = computeAge(birthDate);
  const category = categorizeAge(age);
  const userId = session.user.id;

  try {
    if (category === 'under_13') {
      // Soft-delete + audit (RGPD critical). Sessions PAS supprimées immédiatement
      // pour permettre l'affichage de /age/refus-mineur juste après l'action ;
      // la prochaine requête hors `(onboarding)` redirige `/inscription` via
      // requireVerifiedAuth (deletedAt check). Suppression effective : Story 6.6.
      await db
        .update(users)
        .set({ birthDate: parsed.data.birthDate, deletedAt: new Date() })
        .where(eq(users.id, userId));
      await auditLog({
        actorId: userId,
        actorType: 'USER',
        event: 'consent.minor_under_13_refused',
        targetType: 'user',
        targetId: userId,
        metadata: { age, anonymizationScheduled: true },
      });
      await auditLog({
        actorId: 'system',
        actorType: 'SYSTEM',
        event: 'account.minor_under_13_anonymization_scheduled',
        targetType: 'user',
        targetId: userId,
      });
      return { ok: true, data: { redirectTo: '/age/refus-mineur' } };
    }

    if (category === 'minor') {
      await db
        .update(users)
        .set({ birthDate: parsed.data.birthDate, consentStatus: 'PENDING_PARENTAL_CONSENT' })
        .where(eq(users.id, userId));
      await auditLog({
        actorId: userId,
        actorType: 'USER',
        event: 'consent.parental_required',
        targetType: 'user',
        targetId: userId,
        metadata: { age },
      });
      return { ok: true, data: { redirectTo: '/age/parental' } };
    }

    // Adult
    await db
      .update(users)
      .set({ birthDate: parsed.data.birthDate, consentStatus: 'GRANTED' })
      .where(eq(users.id, userId));
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'consent.age_verified',
      targetType: 'user',
      targetId: userId,
      metadata: { age, category },
    });
    return { ok: true, data: { redirectTo: '/etape-1-cv' } };
  } catch (err) {
    logger.error({ err, userId }, 'submitBirthDateAction failed');
    return {
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' },
    };
  }
}

export async function redirectAfterAgeSubmit(to: string): Promise<void> {
  redirect(to);
}
