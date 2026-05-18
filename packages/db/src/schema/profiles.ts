import { jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { users } from './users.js';

/**
 * Profil enrichi par parsing CV (Story 1.7).
 *
 * Champs JSONB pour expériences/écoles/compétences/langues : structure flexible
 * V1 (peut évoluer sans migration). Normalisation (référentiel écoles) en Story 1.9.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    firstName: text('first_name'),
    lastName: text('last_name'),
    headline: text('headline'),
    summary: text('summary'),
    phone: text('phone'),
    city: text('city'),
    bio: text('bio'),
    linkedinUrl: text('linkedin_url'),
    // Champs structurés (JSONB)
    experiences: jsonb('experiences').$type<
      Array<{
        company: string | null;
        title: string | null;
        startDate: string | null;
        endDate: string | null;
        description: string | null;
      }>
    >(),
    educations: jsonb('educations').$type<
      Array<{
        school: string | null;
        degree: string | null;
        field: string | null;
        startYear: number | null;
        endYear: number | null;
      }>
    >(),
    skills: jsonb('skills').$type<string[]>(),
    languages: jsonb('languages').$type<string[]>(),
    ...timestamps,
  },
  (table) => [uniqueIndex('idx_profiles_user_id').on(table.userId)],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
