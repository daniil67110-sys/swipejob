import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';

/**
 * Sources d'offres ingérées (Story 2.1). Une row par source (France Travail,
 * APEC, JobTeaser, ...). `lastSyncAt` permet le cron orchestrator de savoir
 * quand re-puller. `enabled=false` → source pause sans la supprimer (audit).
 */
export const offerSources = pgTable(
  'offer_sources',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text('name').notNull().unique(),
    apiUrl: text('api_url'),
    enabled: boolean('enabled').notNull().default(true),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (table) => [index('idx_offer_sources_enabled').on(table.enabled)],
);

export type OfferSource = typeof offerSources.$inferSelect;
export type NewOfferSource = typeof offerSources.$inferInsert;
