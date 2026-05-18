'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { preferences } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { enqueueMatchComputeFirst } from '@/lib/queue';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

// Enums fermés serveur (cohérent avec PreferencesForm). Reject toute valeur
// arbitraire envoyée par un client malveillant (XSS, fingerprinting, etc.).
const CONTRACT_TYPE = z.enum(['stage', 'alternance']);
const DURATION = z.enum(['1-3 mois', '3-6 mois', '6-12 mois', '12+ mois']);
const WORK_MODE = z.enum(['on-site', 'hybrid', 'remote']);
const SECTOR = z.enum([
  'tech',
  'finance',
  'marketing',
  'conseil',
  'industrie',
  'santé',
  'public',
  'autre',
]);
const COMPANY_SIZE = z.enum(['TPE', 'PME', 'ETI', 'grandes']);

const schema = z.object({
  contractTypes: z.array(CONTRACT_TYPE).max(10).default([]),
  durations: z.array(DURATION).max(10).default([]),
  // Villes : input libre (pas de référentiel V1) MAIS borné en longueur et taille
  // pour éviter XSS/DoS. Trim + filter chars dangereux.
  cities: z
    .array(
      z
        .string()
        .min(1)
        .max(100)
        .regex(/^[^<>{}]+$/, 'caractères non autorisés'),
    )
    .max(20)
    .default([]),
  geoRadiusKm: z.number().int().min(0).max(500).optional(),
  workModes: z.array(WORK_MODE).max(3).default([]),
  sectors: z.array(SECTOR).max(10).default([]),
  companySizes: z.array(COMPANY_SIZE).max(4).default([]),
  salaryMinMonthly: z.number().int().min(0).max(100000).optional().nullable(),
  salaryMaxMonthly: z.number().int().min(0).max(100000).optional().nullable(),
  desiredStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

// Input client volontairement permissif (string[]) — Zod fait le check enum
// côté serveur et rejette les valeurs invalides. Ça évite de typer en dur le
// form client avec les unions Zod (qui sont strictes et propagent).
export type UpdatePreferencesInput = {
  contractTypes?: string[];
  durations?: string[];
  cities?: string[];
  geoRadiusKm?: number;
  workModes?: string[];
  sectors?: string[];
  companySizes?: string[];
  salaryMinMonthly?: number | null;
  salaryMaxMonthly?: number | null;
  desiredStartDate?: string | null;
};

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

    // Story 2.14 : trigger job prioritaire match.compute.first pour générer
    // le premier deck en arrière-plan pendant la redirection vers /deck.
    const enqueued = await enqueueMatchComputeFirst({ userId });
    if (!enqueued.ok) {
      logger.warn({ err: enqueued.error, userId }, 'match-compute-first enqueue failed');
    } else if ('mock' in enqueued && enqueued.mock) {
      logger.warn({ userId }, 'match-compute-first enqueued in mock mode');
    }

    return { ok: true, data: { redirectTo: '/deck' } };
  } catch (err) {
    logger.error({ err, userId }, 'updatePreferencesAction failed');
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' } };
  }
}
