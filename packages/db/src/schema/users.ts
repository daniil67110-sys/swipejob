import { customType, date, index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';

export const userRole = pgEnum('user_role', ['USER', 'ADMIN']);
export const authSource = pgEnum('auth_source', [
  'GOOGLE',
  'EMAIL',
  'APPLE',
  'MAGIC_LINK',
  'UNKNOWN',
]);
export const consentStatus = pgEnum('consent_status', [
  'PENDING',
  'GRANTED',
  'PENDING_PARENTAL_CONSENT',
  'REFUSED',
]);

// Postgres `citext` extension — emails case-insensitive (NFR-Se).
const citext = customType<{ data: string }>({
  dataType: () => 'citext',
});

/**
 * Convention adapter `@auth/drizzle-adapter` : clé TS doit être `emailVerified`
 * (pas `emailVerifiedAt`). Le nom SQL `email_verified_at` reste en snake_case.
 *
 * `locale` : BCP 47 format attendu ('fr-FR', 'en-US'). Valider côté API avant insert.
 */
export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    email: citext('email').notNull().unique(),
    emailVerified: timestamp('email_verified_at', { withTimezone: true, mode: 'date' }),
    name: text('name'),
    image: text('image'),
    locale: text('locale').notNull().default('fr-FR'),
    role: userRole('role').notNull().default('USER'),
    source: authSource('source').notNull().default('UNKNOWN'),
    // Date sans timezone intentionnel : la date de naissance n'a pas de notion
    // de timezone (déviation documentée vs convention timestamptz architecture.md ligne 555).
    birthDate: date('birth_date'),
    consentStatus: consentStatus('consent_status').notNull().default('PENDING'),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  // Pas d'index explicite sur `email` : la contrainte UNIQUE crée déjà un index unique
  // utilisé par Postgres pour les lookups. Doublon évité (F-003).
  (table) => [index('idx_users_deleted_at').on(table.deletedAt)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
