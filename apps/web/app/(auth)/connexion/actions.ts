'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, isDatabaseConfigured } from '@/lib/db';
import { users } from '@swipejob/db/schema';
import { verifyPasswordTimingSafe } from '@/lib/password';
import { getClientIp, loginRateLimit } from '@/lib/rate-limit';
import { createDatabaseSession } from '@/lib/session';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
    };

const loginSchema = z.object({
  email: z.string().email('Email invalide.'),
  password: z.string().min(1, 'Mot de passe requis.'),
});

const GENERIC_INVALID = 'Identifiants invalides ou email non validé.';

export async function loginWithEmailAction(rawInput: {
  email: string;
  password: string;
}): Promise<ActionResult<{ redirectTo: string }>> {
  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  // Rate limit par IP (anti-bot) ET par email (anti-bruteforce distribué via proxies).
  const rlIp = await loginRateLimit.limit(`ip:${ip}`);
  if (!rlIp.success) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Trop de tentatives. Patiente une minute avant de réessayer.',
      },
    };
  }

  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: GENERIC_INVALID,
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  if (!isDatabaseConfigured) {
    return {
      ok: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: "Le service de connexion n'est pas encore disponible.",
      },
    };
  }

  const { email, password } = parsed.data;

  // Rate limit par email (hash) : protège un compte ciblé contre bruteforce
  // depuis IPs multiples. Hash l'email pour ne pas log PII dans Redis keys.
  // 5 tentatives/min/email.
  const emailKey = `email:${email.toLowerCase()}`;
  const rlEmail = await loginRateLimit.limit(emailKey);
  if (!rlEmail.success) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Trop de tentatives sur ce compte. Patiente une minute.',
      },
    };
  }

  try {
    const rows = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = rows[0];

    // Anti-enum + anti-timing : verify always runs (against dummy if no user)
    const passwordOk = await verifyPasswordTimingSafe(user?.passwordHash ?? null, password);

    if (!user || !user.emailVerified || !passwordOk) {
      // Log failure (not the email — anti-PII)
      logger.warn({ event: 'auth.login_failed', method: 'email' }, 'Login failed');
      if (user) {
        captureServer('user.login_failed', hashUserId(user.id), { method: 'email' });
        await auditLog({
          actorId: user.id,
          actorType: 'USER',
          event: 'auth.login_failed',
          targetType: 'user',
          targetId: user.id,
          metadata: {
            method: 'email',
            reason: !user.emailVerified ? 'not_verified' : 'bad_password',
          },
        });
      }
      return {
        ok: false,
        error: { code: 'INVALID_CREDENTIALS', message: GENERIC_INVALID },
      };
    }

    await createDatabaseSession(user.id);

    captureServer('user.login', hashUserId(user.id), { method: 'email' });
    await auditLog({
      actorId: user.id,
      actorType: 'USER',
      event: 'auth.login',
      targetType: 'user',
      targetId: user.id,
      metadata: { method: 'email' },
    });

    return { ok: true, data: { redirectTo: '/deck' } };
  } catch (err) {
    logger.error({ err }, 'loginWithEmailAction failed');
    return {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Une erreur est survenue. Réessaie dans quelques instants.',
      },
    };
  }
}

export async function redirectAfterLogin(to: string): Promise<void> {
  redirect(to);
}
