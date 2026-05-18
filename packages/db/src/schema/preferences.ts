import { boolean, date, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
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
    ...timestamps,
  },
  (table) => [uniqueIndex('idx_preferences_user_id').on(table.userId)],
);

export type Preferences = typeof preferences.$inferSelect;
export type NewPreferences = typeof preferences.$inferInsert;
