import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { users } from './users.js';

/**
 * Story 5.3 — Parrainage.
 *
 * `referral_codes` : un code unique par user, généré lazily à la première
 * visite de /profil/parrainage. Format 6 chars alphanum (alphabet safe sans
 * O/0/I/1/L/U).
 */
export const referralCodes = pgTable(
  'referral_codes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_referral_codes_user_id').on(table.userId),
    uniqueIndex('idx_referral_codes_code').on(table.code),
  ],
);

export type ReferralCode = typeof referralCodes.$inferSelect;
export type NewReferralCode = typeof referralCodes.$inferInsert;

/**
 * `referrals` : une row par filleul. `signupAt` set au moment de la création
 * du compte, `validatedAt` set au premier swipe du filleul. UNIQUE sur
 * `refereeUserId` : un user ne peut être le filleul qu'une fois.
 */
export const referrals = pgTable(
  'referrals',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    referrerUserId: text('referrer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refereeUserId: text('referee_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    signupAt: timestamp('signup_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    validatedAt: timestamp('validated_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('idx_referrals_referee_user_id').on(table.refereeUserId),
    index('idx_referrals_referrer_user_id').on(table.referrerUserId),
  ],
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
