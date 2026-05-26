import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/lib/db';
import { restorationTokens, users } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';

/**
 * Story 6.4 — Tokens de rétractation de suppression (valides 7 jours).
 *
 * Le token clair est envoyé par email. Côté DB on stocke uniquement son
 * SHA-256. Au clic sur /rgpd/restaurer/[token], on hash → cherche la row
 * non-utilisée et non-expirée → on clear users.deletedAt.
 */

const RESTORATION_TOKEN_TTL_MS = 7 * 24 * 3600 * 1000;
const RESTORATION_TOKEN_BYTES = 32; // 256 bits → 64 hex chars

export function hashRestorationToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

export async function createRestorationToken(
  userId: string,
): Promise<{ plainToken: string; expiresAt: Date }> {
  const plainToken = randomBytes(RESTORATION_TOKEN_BYTES).toString('hex');
  const tokenHash = hashRestorationToken(plainToken);
  const expiresAt = new Date(Date.now() + RESTORATION_TOKEN_TTL_MS);
  if (isDatabaseConfigured) {
    await db.insert(restorationTokens).values({ userId, tokenHash, expiresAt });
  }
  return { plainToken, expiresAt };
}

export type RestorationResult =
  | { ok: true; userId: string }
  | { ok: false; code: 'invalid' | 'expired' | 'used' | 'already_restored' };

/**
 * Restaure le compte du user. Idempotent : si le compte n'est plus en
 * `deletedAt`, retourne `already_restored`. Marque le token comme utilisé.
 */
export async function consumeRestorationToken(plainToken: string): Promise<RestorationResult> {
  if (!isDatabaseConfigured) return { ok: false, code: 'invalid' };
  const tokenHash = hashRestorationToken(plainToken);

  const rows = await db
    .select({
      id: restorationTokens.id,
      userId: restorationTokens.userId,
      expiresAt: restorationTokens.expiresAt,
      usedAt: restorationTokens.usedAt,
    })
    .from(restorationTokens)
    .where(eq(restorationTokens.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, code: 'invalid' };
  if (row.usedAt) return { ok: false, code: 'used' };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, code: 'expired' };

  const userRows = await db
    .select({ id: users.id, deletedAt: users.deletedAt, purgedAt: users.purgedAt })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);
  const user = userRows[0];
  if (!user) return { ok: false, code: 'invalid' };
  if (user.purgedAt) return { ok: false, code: 'expired' };
  if (!user.deletedAt) return { ok: false, code: 'already_restored' };

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ deletedAt: null, consentStatus: 'GRANTED' })
      .where(eq(users.id, row.userId));
    await tx
      .update(restorationTokens)
      .set({ usedAt: new Date() })
      .where(eq(restorationTokens.id, row.id));
  });

  await auditLog({
    actorId: row.userId,
    actorType: 'USER',
    event: 'account.deletion_cancelled',
    targetType: 'user',
    targetId: row.userId,
    metadata: { method: 'restoration_token' },
  });
  captureServer('account.deletion_cancelled', hashUserId(row.userId), {});

  return { ok: true, userId: row.userId };
}

/**
 * À appeler au moment où la suppression est exécutée physiquement (worker).
 * Marque tous les tokens non-utilisés et non-expirés du user comme `used` pour
 * empêcher toute future tentative de restauration.
 */
export async function voidPendingRestorationTokens(userId: string): Promise<void> {
  if (!isDatabaseConfigured) return;
  await db
    .update(restorationTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(restorationTokens.userId, userId),
        isNull(restorationTokens.usedAt),
        gt(restorationTokens.expiresAt, new Date(0)),
      ),
    );
}
