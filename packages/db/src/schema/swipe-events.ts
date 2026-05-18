import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { offers } from './offers.js';
import { users } from './users.js';

export const swipeDirection = pgEnum('swipe_direction', ['left', 'right', 'up']);

/**
 * Swipe events (Story 3.4) — append-only.
 *
 * left = pass, right = apply, up = save to watchlist.
 * UNIQUE(userId, offerId) : un user ne peut swipe qu'une fois par offre.
 * Pour les "up" qui veulent ensuite "right", V1 = relâcher dans la watchlist UI
 * (Story 4.x). V1 strict : 1 swipe = 1 décision finale.
 */
export const swipeEvents = pgTable(
  'swipe_events',
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
    direction: swipeDirection('direction').notNull(),
    swipedAt: timestamp('swiped_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_swipe_events_user_offer').on(table.userId, table.offerId),
    index('idx_swipe_events_user_swiped_at').on(table.userId, table.swipedAt),
  ],
);

export type SwipeEvent = typeof swipeEvents.$inferSelect;
export type NewSwipeEvent = typeof swipeEvents.$inferInsert;
