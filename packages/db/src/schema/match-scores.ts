import {
  doublePrecision,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { offers } from './offers.js';
import { users } from './users.js';

/**
 * Scores de matching utilisateur × offre (Story 2.1, calcul Story 2.8).
 * Re-calcul nocturne via job match-compute. UNIQUE(userId, offerId) garantit
 * upsert atomique (un user a 1 seul score par offre, ré-écrit à chaque calcul).
 *
 * `explanation` jsonb porte les features qui ont contribué au score
 * (proximité géo, skills matchées, niveau études, etc.) pour explicabilité
 * IA Act (Story 2.11).
 */
export const matchScores = pgTable(
  'match_scores',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    offerId: text('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    score: doublePrecision('score').notNull(),
    explanation: jsonb('explanation').$type<{
      contributingFactors: Array<{ factor: string; weight: number; value: unknown }>;
      modelVersion: string;
    }>(),
    computedAt: timestamp('computed_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_match_scores_user_offer').on(table.userId, table.offerId),
    index('idx_match_scores_user_score').on(table.userId, table.score),
  ],
);

export type MatchScore = typeof matchScores.$inferSelect;
export type NewMatchScore = typeof matchScores.$inferInsert;
