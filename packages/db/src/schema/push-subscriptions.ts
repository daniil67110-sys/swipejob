import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { users } from './users.js';

/**
 * Abonnements Web Push (Story 4.4).
 *
 * Endpoint unique : la même URL ne peut pas être souscrite deux fois.
 * Un utilisateur peut avoir plusieurs subscriptions (un par device/navigateur).
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: text('user_agent'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_push_subscriptions_endpoint').on(table.endpoint),
    index('idx_push_subscriptions_user').on(table.userId),
  ],
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
