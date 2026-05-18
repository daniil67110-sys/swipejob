import { boolean, index, pgTable, text } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';

/**
 * Référentiel écoles FR (Story 1.9). Fuzzy search via pg_trgm sur `nameNormalized`.
 * Seed initial ~50 écoles V1 — extension à 500+ deferred (D-1.9-001).
 */
export const schools = pgTable(
  'schools',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text('name').notNull(),
    nameNormalized: text('name_normalized').notNull(),
    acronym: text('acronym'),
    type: text('type'),
    city: text('city'),
    unverified: boolean('unverified').notNull().default(false),
    ...timestamps,
  },
  (table) => [index('idx_schools_name_normalized').on(table.nameNormalized)],
);

export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
