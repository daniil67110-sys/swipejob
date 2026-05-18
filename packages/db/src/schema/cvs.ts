import { index, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { users } from './users.js';

export const cvParsingStatus = pgEnum('cv_parsing_status', ['pending', 'completed', 'failed']);

/**
 * CVs uploadés par les utilisateurs (Story 1.6).
 *
 * `r2Key` est l'objet R2 (chemin unique users/<userId>/cvs/v<n>/<cuid>.pdf).
 * `version` croît à chaque réupload (le parsing échoué d'une version doit pas
 * empêcher de réuploader).
 *
 * `parsingStatus` lifecycle : 'pending' → 'completed' (Story 1.7) ou 'failed'.
 * `parsingError` est NULL en succès, contient un message FR en cas d'échec.
 */
export const cvs = pgTable(
  'cvs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull().unique(),
    originalFilename: text('original_filename').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    mimeType: text('mime_type').notNull(),
    parsingStatus: cvParsingStatus('parsing_status').notNull().default('pending'),
    parsingError: text('parsing_error'),
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index('idx_cvs_user_id').on(table.userId),
    index('idx_cvs_parsing_status').on(table.parsingStatus),
  ],
);

export type Cv = typeof cvs.$inferSelect;
export type NewCv = typeof cvs.$inferInsert;
