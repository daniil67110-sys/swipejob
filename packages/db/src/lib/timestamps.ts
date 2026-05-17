import { timestamp } from 'drizzle-orm/pg-core';

/**
 * Helper colonnes timestamp partagées entre toutes les tables.
 * Architecture.md ligne 420 : tables ont `created_at`, `updated_at` partout,
 * `deleted_at` pour soft delete (uniquement users V1).
 */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
