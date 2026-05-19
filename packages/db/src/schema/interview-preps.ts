import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { applications } from './applications.js';

/**
 * Coach IA pré-entretien (Story 4.7).
 * Une row par application (le check unique sur application_id rend le job idempotent).
 */
export const interviewPreps = pgTable(
  'interview_preps',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    companySummary: text('company_summary').notNull(),
    probableQuestions: text('probable_questions').array().notNull().default([]),
    matchingStrengths: text('matching_strengths').array().notNull().default([]),
    generatedAt: timestamp('generated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    model: text('model'),
    ...timestamps,
  },
  (table) => [uniqueIndex('idx_interview_preps_application').on(table.applicationId)],
);

export type InterviewPrep = typeof interviewPreps.$inferSelect;
export type NewInterviewPrep = typeof interviewPreps.$inferInsert;
