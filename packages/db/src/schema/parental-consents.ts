import { customType, index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { users } from './users.js';

export const parentalConsentStatus = pgEnum('parental_consent_status', [
  'PENDING',
  'GRANTED',
  'REFUSED',
  'EXPIRED',
]);

const citext = customType<{ data: string }>({
  dataType: () => 'citext',
});

/**
 * Consent parental documenté pour utilisateurs 13-17 ans (Story 1.5).
 *
 * Pas de UNIQUE(userId) — on conserve l'historique des demandes (renvoi possible
 * si le parent ne répond pas dans les 7 jours). L'app prend en compte la dernière
 * row PENDING/GRANTED par userId.
 *
 * `tokenHash` = sha256 du token signé envoyé dans l'URL email (anti-replay vol DB,
 * pattern identique à `verification_tokens` Story 1.4).
 *
 * Audit RGPD : `ipAddress` + `userAgent` capturés au moment du clic parent pour
 * traçabilité CNIL (contrôle a posteriori).
 */
export const parentalConsents = pgTable(
  'parental_consents',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentName: text('parent_name').notNull(),
    parentEmail: citext('parent_email').notNull(),
    status: parentalConsentStatus('status').notNull().default('PENDING'),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true, mode: 'date' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    ...timestamps,
  },
  (table) => [
    index('idx_parental_consents_user_id').on(table.userId),
    index('idx_parental_consents_status').on(table.status),
    index('idx_parental_consents_token_hash').on(table.tokenHash),
  ],
);

export type ParentalConsent = typeof parentalConsents.$inferSelect;
export type NewParentalConsent = typeof parentalConsents.$inferInsert;
