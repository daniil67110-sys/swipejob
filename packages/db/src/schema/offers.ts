import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { offerSources } from './offer-sources.js';

// pgvector custom type. Dimension 1024 = Mistral-Embed default.
const vector1024 = customType<{ data: number[]; driverData: string }>({
  dataType: () => 'vector(1024)',
  toDriver: (value) => `[${value.join(',')}]`,
  fromDriver: (value) => JSON.parse(value),
});

// Postgres citext pour contact_email (case-insensitive search).
const citext = customType<{ data: string }>({
  dataType: () => 'citext',
});

/**
 * Offres ingérées (Story 2.1). UNIQUE(sourceId, externalId) garantit qu'un
 * job d'ingestion idempotent ne crée pas de doublons sur retry.
 *
 * `embedding` est calculé en background (Story 2.8) — peut être null en V1.
 * `expiresAt` permet l'expiration automatique (Story 2.6).
 */
export const offers = pgTable(
  'offers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    sourceId: text('source_id')
      .notNull()
      .references(() => offerSources.id, { onDelete: 'cascade' }),
    externalId: text('external_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    companyName: text('company_name'),
    companyLogoUrl: text('company_logo_url'),
    contractType: text('contract_type'),
    locationCity: text('location_city'),
    locationLat: doublePrecision('location_lat'),
    locationLng: doublePrecision('location_lng'),
    remoteMode: text('remote_mode'),
    salaryMinMonthly: integer('salary_min_monthly'),
    salaryMaxMonthly: integer('salary_max_monthly'),
    startDate: date('start_date'),
    duration: text('duration'),
    requirements: jsonb('requirements').$type<{
      skills?: string[];
      educationLevels?: string[];
      languages?: string[];
    }>(),
    embedding: vector1024('embedding'),
    // Story 2.2 : payload brut de la source (audit, débug, re-mapping si schéma évolue).
    rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>(),
    // Story 2.4 : normalisation
    qualityScore: doublePrecision('quality_score'),
    sourceUrl: text('source_url'),
    contactEmail: citext('contact_email'),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    normalizedAt: timestamp('normalized_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_offers_source_external').on(table.sourceId, table.externalId),
    index('idx_offers_is_active').on(table.isActive),
    index('idx_offers_expires_at').on(table.expiresAt),
    index('idx_offers_contract_type').on(table.contractType),
    // Story 2.4 : index partiel pour matching (filtre les low quality).
    index('idx_offers_quality_high')
      .on(table.qualityScore)
      .where(sql`${table.qualityScore} >= 0.6`),
    // Story 2.4 : index pour batch normalize WHERE normalized_at IS NULL.
    index('idx_offers_not_normalized')
      .on(table.id)
      .where(sql`${table.normalizedAt} IS NULL`),
  ],
);

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
