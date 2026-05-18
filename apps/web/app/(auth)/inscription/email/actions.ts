'use server';

import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, isDatabaseConfigured } from '@/lib/db';
import { users, verificationTokens } from '@swipejob/db/schema';
import { hashPassword } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';
import { getClientIp, signupRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { env, isEmailConfigured } from '@/lib/env';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
    };

const signupSchema = z.object({
  email: z.string().email("Email invalide. Vérifie qu'il a la forme nom@domaine.fr."),
  password: z
    .string()
    .min(10, 'Le mot de passe doit faire au moins 10 caractères.')
    .regex(/[a-zA-Z]/, 'Le mot de passe doit contenir au moins une lettre.')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.'),
});

const NEUTRAL_OK_MESSAGE =
  'Si un compte est éligible, un email avec un lien de validation vient de partir. Vérifie ta boîte (et tes spams), le lien est valide 24h.';

function hashToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

export async function signupWithEmailAction(rawInput: {
  email: string;
  password: string;
}): Promise<ActionResult<{ message: string }>> {
  // 1) Rate limit (5/h/IP)
  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const rl = await signupRateLimit.limit(ip);
  if (!rl.success) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Trop de tentatives. Réessaie dans une heure.',
      },
    };
  }

  // 2) Validation Zod serveur
  const parsed = signupSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Vérifie les champs en erreur.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }
  const { email, password } = parsed.data;

  // 3) Mode conditionnel : impossible sans DB ou email
  if (!isDatabaseConfigured) {
    logger.warn('signupWithEmailAction called without DATABASE_URL');
    return {
      ok: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: "L'inscription par email n'est pas encore disponible. Réessaie plus tard.",
      },
    };
  }

  // 4) Pré-hash password AVANT le branch (anti-enum timing — argon2 ~100ms domine
  //    le coût ; cela égalise le timing entre nouveau user / existant non vérifié /
  //    existant vérifié, indépendamment du résultat du lookup).
  const passwordHash = await hashPassword(password);

  try {
    // 5) Vérification existant
    const existing = await db
      .select({ id: users.id, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;

    if (existing[0]) {
      if (existing[0].emailVerified) {
        // Anti-enum : message neutre identique, pas d'email envoyé.
        // Audit interne pour monitoring abus (probe d'emails).
        await auditLog({
          actorId: existing[0].id,
          actorType: 'USER',
          event: 'auth.signup_attempt_existing_verified',
          targetType: 'user',
          targetId: existing[0].id,
          metadata: { method: 'email' },
        });
        return { ok: true, data: { message: NEUTRAL_OK_MESSAGE } };
      }
      // Compte existant non vérifié → refresh hash + renvoi lien
      await db
        .update(users)
        .set({ passwordHash, source: 'EMAIL' })
        .where(eq(users.id, existing[0].id));
      userId = existing[0].id;
    } else {
      // Nouveau user
      const inserted = await db
        .insert(users)
        .values({ email, passwordHash, source: 'EMAIL' })
        .returning({ id: users.id });
      const row = inserted[0];
      if (!row) {
        throw new Error('Insert user returned no row');
      }
      userId = row.id;
    }

    // 5) Génère token (plain → URL, hash → DB)
    const tokenPlain = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(tokenPlain);
    const expires = new Date(Date.now() + 24 * 3600 * 1000);

    // verification_tokens accepte plusieurs tokens par identifier — purge les vieux non utilisés.
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
    await db.insert(verificationTokens).values({
      identifier: email,
      token: tokenHash,
      expires,
    });

    // 6) Envoi email (mode conditionnel : log mock si pas de Resend)
    const verificationUrl = `${env.SITE_URL}/inscription/valider-email?token=${tokenPlain}`;
    const emailRes = await sendVerificationEmail({ to: email, verificationUrl });
    if (!emailRes.ok) {
      logger.error({ to: email }, 'Verification email send failed');
      // On ne révèle pas l'échec à l'utilisateur (anti-enum), mais on flag en interne
    }

    // 7) Posthog + audit log
    captureServer('user.signup_pending_verification', hashUserId(userId), {
      method: 'email',
      emailMock: !isEmailConfigured,
    });
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'auth.signup',
      targetType: 'user',
      targetId: userId,
      metadata: { method: 'email', verified: false },
    });

    return { ok: true, data: { message: NEUTRAL_OK_MESSAGE } };
  } catch (err) {
    logger.error({ err }, 'signupWithEmailAction failed');
    return {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Une erreur est survenue. Réessaie dans quelques instants.',
      },
    };
  }
}
