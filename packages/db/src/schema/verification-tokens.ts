import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Verification tokens Auth.js v5 (magic links email/passwordless).
 * Clé TS `expires` requise par l'adapter Auth.js (pas `expiresAt`).
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
