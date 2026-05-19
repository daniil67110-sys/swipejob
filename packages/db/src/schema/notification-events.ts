import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '../lib/id.js';
import { users } from './users.js';

/**
 * Journal d'envois notifications (Story 4.4/4.5/4.7).
 *
 * - `channel` : 'push' | 'email_digest' | 'email_interview' | 'email_unsubscribed'.
 * - `eventType` : 'sent' | 'clicked' | 'failed' | 'opened' (digest via pixel) | 'unsubscribed'.
 * - `referenceKey` : clé d'idempotence (ex : 'digest:2026-W20', 'push:deck:2026-05-19').
 *   Si non-null + déjà existant pour la combinaison → skip envoi.
 */
export const notificationEvents = pgTable(
  'notification_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: text('channel').notNull(),
    eventType: text('event_type').notNull(),
    referenceKey: text('reference_key'),
    metadata: text('metadata'),
    at: timestamp('at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_notification_events_user_at').on(table.userId, table.at),
    uniqueIndex('idx_notification_events_reference')
      .on(table.userId, table.channel, table.eventType, table.referenceKey)
      .where(sql`${table.referenceKey} IS NOT NULL`),
  ],
);

export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type NewNotificationEvent = typeof notificationEvents.$inferInsert;
