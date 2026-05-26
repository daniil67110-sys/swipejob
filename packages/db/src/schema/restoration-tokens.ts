import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { users } from './users.js';

/**
 * Story 6.4 — Tokens de rétractation d'une demande de suppression.
 *
 * À la demande de suppression, on génère un token aléatoire, son hash SHA-256
 * est stocké ici (jamais le token brut), et le token brut part par email avec
 * un lien `/rgpd/restaurer/[token]` valide 7 jours.
 *
 * Au clic, on hash le token reçu, on cherche la row non-expirée et non-utilisée,
 * on clear `users.deletedAt`, on supprime le job rgpd-delete enqueued (best
 * effort) et on log un audit `account.deletion_cancelled`.
 */
export const restorationTokens = pgTable(
  'restoration_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 hex (64 chars). Jamais le token clair. */
    tokenHash: text('token_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('idx_restoration_tokens_hash').on(table.tokenHash),
    index('idx_restoration_tokens_user_id').on(table.userId),
  ],
);

export type RestorationToken = typeof restorationTokens.$inferSelect;
export type NewRestorationToken = typeof restorationTokens.$inferInsert;
