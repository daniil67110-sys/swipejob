import { boolean, date, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { users } from './users.js';

/**
 * Préférences de recherche (Story 1.8). Une row par user.
 * Arrays Postgres TEXT[] pour multi-select (contractTypes, cities, etc.).
 */
export const preferences = pgTable(
  'preferences',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contractTypes: text('contract_types').array().notNull().default([]),
    durations: text('durations').array().notNull().default([]),
    cities: text('cities').array().notNull().default([]),
    geoRadiusKm: integer('geo_radius_km').default(50),
    workModes: text('work_modes').array().notNull().default([]),
    sectors: text('sectors').array().notNull().default([]),
    companySizes: text('company_sizes').array().notNull().default([]),
    salaryMinMonthly: integer('salary_min_monthly'),
    salaryMaxMonthly: integer('salary_max_monthly'),
    desiredStartDate: date('desired_start_date'),
    // Story 3.7 : si true → preview lettre avant envoi (mode review).
    reviewBeforeSend: boolean('review_before_send').notNull().default(false),
    // Epic 4 — Notifications (Story 4.4/4.5/4.6)
    /** Story 4.4 — opt-in Web Push. */
    pushEnabled: boolean('push_enabled').notNull().default(false),
    /** Story 4.4 — heure d'envoi push deck du jour (format HH:MM 24h, locale user). */
    pushTime: text('push_time').notNull().default('08:00'),
    /** Story 4.6 — emails opérationnels (verif, RGPD, application) — toujours on par défaut. */
    emailTransactionalEnabled: boolean('email_transactional_enabled').notNull().default(true),
    /** Story 4.6 — emails marketing (annonces produit). */
    emailMarketingEnabled: boolean('email_marketing_enabled').notNull().default(false),
    /** Story 4.5 — digest hebdomadaire. */
    emailDigestEnabled: boolean('email_digest_enabled').notNull().default(false),
    /** Story 4.5/4.6 — fréquence : 'weekly' | 'never'. (daily = V2). */
    emailDigestFrequency: text('email_digest_frequency').notNull().default('weekly'),
    /** Story 4.5 — token un-clic unsubscribe (généré lazy). */
    emailUnsubscribeToken: text('email_unsubscribe_token'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_preferences_user_id').on(table.userId),
    uniqueIndex('idx_preferences_email_unsubscribe_token')
      .on(table.emailUnsubscribeToken)
      .where(sql`${table.emailUnsubscribeToken} IS NOT NULL`),
  ],
);

export type Preferences = typeof preferences.$inferSelect;
export type NewPreferences = typeof preferences.$inferInsert;
