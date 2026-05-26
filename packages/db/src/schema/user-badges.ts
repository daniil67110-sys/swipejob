import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { users } from './users.js';

/**
 * User badges (Story 5.2) — append-only.
 *
 * Une row par badge débloqué. UNIQUE(userId, badgeCode) pour idempotence
 * (re-check des unlocks n'insère pas de doublon).
 *
 * Le catalogue de badges (codes + critères + libellés) est versionné en code
 * dans `apps/web/lib/badges.ts` — la DB ne contient que les unlocks.
 */
export const userBadges = pgTable(
  'user_badges',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeCode: text('badge_code').notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_user_badges_user_badge').on(table.userId, table.badgeCode),
    index('idx_user_badges_user_unlocked_at').on(table.userId, table.unlockedAt),
  ],
);

export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
