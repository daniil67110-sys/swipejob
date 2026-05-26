import { boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { users } from './users.js';

/**
 * Story 6.2 — Consentements granulaires par finalité.
 *
 * Append-only : chaque modification crée une nouvelle row, la plus récente
 * (par (userId, purpose, createdAt DESC)) fait foi. Permet de reconstituer
 * l'historique pour preuve RGPD art. 7 (preuve consentement éclairé).
 *
 * `purpose` correspond à une finalité du catalogue en code (consents.ts).
 * `policyVersion` permet d'invalider d'anciens consentements si la politique
 * de confidentialité change matériellement.
 */
export const userConsents = pgTable(
  'user_consents',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose').notNull(),
    granted: boolean('granted').notNull(),
    policyVersion: integer('policy_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_user_consents_user_purpose_created').on(
      table.userId,
      table.purpose,
      table.createdAt,
    ),
  ],
);

export type UserConsent = typeof userConsents.$inferSelect;
export type NewUserConsent = typeof userConsents.$inferInsert;
