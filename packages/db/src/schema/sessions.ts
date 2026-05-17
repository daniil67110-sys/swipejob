import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { users } from './users.js';

/**
 * Sessions Auth.js v5.
 *
 * Convention adapter `@auth/drizzle-adapter` : clés TS doivent matcher
 * `sessionToken`, `userId`, `expires` (sinon l'adapter ne trouve pas les colonnes).
 * Les noms SQL restent en snake_case (convention architecture).
 *
 * `lastSeenAt` est mise à jour via middleware Auth.js sur chaque requête
 * authentifiée (helper `db.update(sessions).set({ lastSeenAt: new Date() })`).
 * `$onUpdate` se déclenche sur tout UPDATE Drizzle de la table.
 */
export const sessions = pgTable(
  'sessions',
  {
    sessionToken: text('session_token')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true, mode: 'date' }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_expires').on(table.expires),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
