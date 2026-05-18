'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { preferences } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const optionalArr = z.array(z.string()).default([]);

const schema = z.object({
  contractTypes: optionalArr,
  durations: optionalArr,
  cities: optionalArr,
  geoRadiusKm: z.number().int().min(0).max(500).optional(),
  workModes: optionalArr,
  sectors: optionalArr,
  companySizes: optionalArr,
  salaryMinMonthly: z.number().int().min(0).max(100000).optional().nullable(),
  salaryMaxMonthly: z.number().int().min(0).max(100000).optional().nullable(),
  desiredStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export type UpdatePreferencesInput = z.input<typeof schema>;

export async function updatePreferencesAction(
  rawInput: UpdatePreferencesInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }

  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Champs invalides.' } };
  }

  const userId = session.user.id;
  const data = parsed.data;

  // Sanity check salary range
  if (
    data.salaryMinMonthly != null &&
    data.salaryMaxMonthly != null &&
    data.salaryMinMonthly > data.salaryMaxMonthly
  ) {
    return {
      ok: false,
      error: { code: 'BAD_RANGE', message: 'Salaire min > salaire max.' },
    };
  }

  try {
    await db
      .insert(preferences)
      .values({
        userId,
        contractTypes: data.contractTypes,
        durations: data.durations,
        cities: data.cities,
        geoRadiusKm: data.geoRadiusKm ?? 50,
        workModes: data.workModes,
        sectors: data.sectors,
        companySizes: data.companySizes,
        salaryMinMonthly: data.salaryMinMonthly ?? null,
        salaryMaxMonthly: data.salaryMaxMonthly ?? null,
        desiredStartDate: data.desiredStartDate ?? null,
      })
      .onConflictDoUpdate({
        target: preferences.userId,
        set: {
          contractTypes: data.contractTypes,
          durations: data.durations,
          cities: data.cities,
          geoRadiusKm: data.geoRadiusKm ?? 50,
          workModes: data.workModes,
          sectors: data.sectors,
          companySizes: data.companySizes,
          salaryMinMonthly: data.salaryMinMonthly ?? null,
          salaryMaxMonthly: data.salaryMaxMonthly ?? null,
          desiredStartDate: data.desiredStartDate ?? null,
        },
      });

    revalidateTag('user-preferences');

    // Posthog : ne pas envoyer les villes en clair (NFR-S10), juste les counts/enums
    captureServer('preferences.set', hashUserId(userId), {
      contractTypesCount: data.contractTypes.length,
      citiesCount: data.cities.length,
      workModes: data.workModes,
      sectorsCount: data.sectors.length,
      hasSalaryRange: data.salaryMinMonthly != null || data.salaryMaxMonthly != null,
    });
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'preferences.updated',
      targetType: 'preferences',
      targetId: userId,
      metadata: {
        fields: Object.keys(data),
      },
    });

    return { ok: true, data: { redirectTo: '/deck' } };
  } catch (err) {
    logger.error({ err, userId }, 'updatePreferencesAction failed');
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' } };
  }
}
