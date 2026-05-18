import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { offers } from './offers.js';
import { users } from './users.js';

export const applicationStatus = pgEnum('application_status', [
  'pending_letter',
  'letter_generated',
  'pending_review',
  'sent',
  'cancelled_by_user',
  'failed',
]);

export const coverLetterStatus = pgEnum('cover_letter_status', [
  'generated',
  'template_fallback',
  'edited',
]);

/**
 * Applications (Story 3.5/3.6/3.8/3.10).
 *
 * Lifecycle :
 *  pending_letter → letter_generated → (sent | pending_review)
 *  pending_review (Story 3.7) → user edits → sent
 *  sent → (cancelled_by_user dans 30s undo Story 3.8)
 *  letter generation echec → failed (avec template_fallback déjà tenté)
 *
 * Anti-doublon (Story 3.10) : unique partial index sur (userId, offerId) WHERE status != 'cancelled_by_user'.
 */
export const applications = pgTable(
  'applications',
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
    status: applicationStatus('status').notNull().default('pending_letter'),
    coverLetterText: text('cover_letter_text'),
    coverLetterStatus: coverLetterStatus('cover_letter_status'),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_applications_user_offer_active')
      .on(table.userId, table.offerId)
      .where(sql`${table.status} != 'cancelled_by_user'`),
    index('idx_applications_status').on(table.status),
    index('idx_applications_user_sent_at').on(table.userId, table.sentAt),
  ],
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

/**
 * Application events (audit trail granulaire).
 * Sert d'historique pour le dashboard candidatures (Story 4.1) + analytics.
 */
export const applicationEvents = pgTable(
  'application_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    event: text('event').notNull(), // 'letter_generated', 'sent', 'cancelled', 'failed', ...
    metadata: text('metadata'), // JSON string (V1 simple, jsonb futur)
    at: timestamp('at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [index('idx_application_events_app_at').on(table.applicationId, table.at)],
);

export type ApplicationEvent = typeof applicationEvents.$inferSelect;
export type NewApplicationEvent = typeof applicationEvents.$inferInsert;

/**
 * Watchlist (Story 3.4 — swipe haut = save).
 * V1 simple : juste user+offer+savedAt. Pas d'action ultérieure visible V1 (Story 4.x UI).
 */
export const watchlist = pgTable(
  'watchlist',
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
    savedAt: timestamp('saved_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('idx_watchlist_user_offer').on(table.userId, table.offerId)],
);

export type WatchlistEntry = typeof watchlist.$inferSelect;
export type NewWatchlistEntry = typeof watchlist.$inferInsert;
