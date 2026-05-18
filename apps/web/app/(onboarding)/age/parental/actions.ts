'use server';

import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { parentalConsents, users } from '@swipejob/db/schema';
import { sendParentalConsentEmail } from '@/lib/email';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { env } from '@/lib/env';
import { getClientIp, parentalConsentRateLimit } from '@/lib/rate-limit';
import { serverLogger as logger } from '@/lib/logger.server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const schema = z.object({
  parentName: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  parentEmail: z.string().email('Email invalide'),
  confirmed: z.literal(true, { errorMap: () => ({ message: 'Confirmation requise.' }) }),
});

function hashToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

export async function requestParentalConsentAction(rawInput: {
  parentName: string;
  parentEmail: string;
  confirmed: boolean;
}): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const rl = await parentalConsentRateLimit.limit(ip);
  if (!rl.success) {
    return {
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Trop de tentatives. Réessaie dans une heure.' },
    };
  }

  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Vérifie les champs en erreur.' },
    };
  }
  const { parentName, parentEmail } = parsed.data;
  const userId = session.user.id;

  try {
    // Vérifie statut user
    const userRows = await db
      .select({ id: users.id, email: users.email, consentStatus: users.consentStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const userRow = userRows[0];
    if (!userRow || userRow.consentStatus !== 'PENDING_PARENTAL_CONSENT') {
      return {
        ok: false,
        error: { code: 'BAD_STATUS', message: 'État du compte invalide pour cette demande.' },
      };
    }

    // Cherche un consent PENDING non-expiré existant — sinon en créer un nouveau
    const now = new Date();
    const existing = await db
      .select({ id: parentalConsents.id, tokenHash: parentalConsents.tokenHash })
      .from(parentalConsents)
      .where(
        and(
          eq(parentalConsents.userId, userId),
          eq(parentalConsents.status, 'PENDING'),
          gt(parentalConsents.expiresAt, now),
        ),
      )
      .limit(1);

    let tokenPlain: string;
    if (existing[0]) {
      // Reuse : on ne renvoie pas le token plain (on ne l'a plus), on génère un
      // nouveau token (le précédent reste valide jusqu'à expiration mais peu importe)
      tokenPlain = randomBytes(32).toString('base64url');
      const tokenHash = hashToken(tokenPlain);
      await db
        .update(parentalConsents)
        .set({
          tokenHash,
          parentName,
          parentEmail,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        })
        .where(eq(parentalConsents.id, existing[0].id));
    } else {
      tokenPlain = randomBytes(32).toString('base64url');
      const tokenHash = hashToken(tokenPlain);
      await db.insert(parentalConsents).values({
        userId,
        parentName,
        parentEmail,
        status: 'PENDING',
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      });
    }

    const confirmUrl = `${env.SITE_URL}/consentement-parental/confirmer?token=${tokenPlain}`;
    const refuseUrl = `${env.SITE_URL}/consentement-parental/refuser?token=${tokenPlain}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    const emailRes = await sendParentalConsentEmail({
      to: parentEmail,
      childEmail: userRow.email,
      parentName,
      confirmUrl,
      refuseUrl,
      expiresAt,
    });
    if (!emailRes.ok) {
      logger.error({ to: parentEmail }, 'Parental consent email failed');
    }

    captureServer('consent.parental_requested', hashUserId(userId), { method: 'email' });
    await auditLog({
      actorId: userId,
      actorType: 'USER',
      event: 'consent.parental_email_sent',
      targetType: 'user',
      targetId: userId,
      metadata: { parentEmailMock: !emailRes.ok && 'mock' in emailRes ? emailRes.mock : false },
    });

    return { ok: true, data: { redirectTo: '/age/parental/envoye' } };
  } catch (err) {
    logger.error({ err, userId }, 'requestParentalConsentAction failed');
    return {
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erreur. Réessaie.' },
    };
  }
}
