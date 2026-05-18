'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { profiles, schools } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { EDUCATION_LEVELS, normalizeSchoolName } from '@/lib/schools';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const schema = z.object({
  // cuid2 : 24 chars lowercase alphanumérique. Borne pour empêcher DB query
  // sur 10000 chars ou format invalide qui exploite l'index.
  schoolId: z
    .string()
    .regex(/^[a-z0-9]{20,30}$/, 'Format école invalide')
    .nullable(),
  schoolNameUnverified: z.string().min(2).max(150).nullable(),
  educationLevel: z.enum([
    'BTS/DUT',
    'Licence',
    'Bachelor',
    'Master',
    "École d'ingénieur",
    'Doctorat',
  ]),
});

export async function setEducationAction(rawInput: {
  schoolId: string | null;
  schoolNameUnverified: string | null;
  educationLevel: string;
}): Promise<ActionResult<{ ok: true }>> {
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

  try {
    // Transaction : INSERT école unverified + UPDATE profil doivent être atomiques.
    // Sans ça, une école fantôme peut être créée puis l'UPDATE profil échoue → row
    // schools orpheline en DB. Lookup école existante reste hors transaction OK.
    let currentSchool: {
      schoolId: string | null;
      name: string;
      unverified: boolean;
    } | null = null;

    if (data.schoolId) {
      const rows = await db
        .select({ id: schools.id, name: schools.name })
        .from(schools)
        .where(eq(schools.id, data.schoolId))
        .limit(1);
      const row = rows[0];
      if (row) {
        currentSchool = { schoolId: row.id, name: row.name, unverified: false };
      }
      if (!currentSchool) {
        return {
          ok: false,
          error: { code: 'NO_SCHOOL', message: 'École introuvable.' },
        };
      }
      await db
        .update(profiles)
        .set({ currentSchool, educationLevel: data.educationLevel })
        .where(eq(profiles.userId, userId));
    } else if (data.schoolNameUnverified) {
      const nameUnverified = data.schoolNameUnverified;
      // Atomic : insert école unverified + update profil dans 1 tx.
      currentSchool = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(schools)
          .values({
            name: nameUnverified,
            nameNormalized: normalizeSchoolName(nameUnverified),
            unverified: true,
          })
          .returning({ id: schools.id, name: schools.name });
        const row = inserted[0];
        if (!row) throw new Error('Insert unverified school returned no row');
        const current = {
          schoolId: row.id,
          name: row.name,
          unverified: true,
        };
        await tx
          .update(profiles)
          .set({ currentSchool: current, educationLevel: data.educationLevel })
          .where(eq(profiles.userId, userId));
        return current;
      });
    } else {
      return {
        ok: false,
        error: { code: 'NO_SCHOOL', message: 'Choisis une école ou saisis un nom libre.' },
      };
    }

    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'profile.education_updated',
      targetType: 'profile',
      targetId: userId,
      metadata: {
        schoolId: currentSchool.schoolId,
        unverified: currentSchool.unverified,
        educationLevel: data.educationLevel,
      },
    });

    return { ok: true, data: { ok: true } };
  } catch (err) {
    logger.error({ err, userId }, 'setEducationAction failed');
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' } };
  }
}

export { EDUCATION_LEVELS };
