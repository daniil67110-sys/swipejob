import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { users } from './users.js';

export const rgpdExportStatus = pgEnum('rgpd_export_status', [
  'pending',
  'completed',
  'failed',
  'expired',
]);

/**
 * Story 6.3 — Historique des demandes d'export RGPD.
 *
 * Le worker `rgpd-export` crée la row à l'enqueue (`pending`), met à jour à
 * `completed` après upload + email. Les fichiers R2 sont auto-purgés via une
 * politique de lifecycle 7 jours (out-of-band) ou par un job de housekeeping.
 */
export const rgpdExports = pgTable(
  'rgpd_exports',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: rgpdExportStatus('status').notNull().default('pending'),
    jsonR2Key: text('json_r2_key'),
    pdfR2Key: text('pdf_r2_key'),
    requestedAt: timestamp('requested_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    errorMessage: text('error_message'),
  },
  (table) => [
    index('idx_rgpd_exports_user_requested').on(table.userId, table.requestedAt),
    index('idx_rgpd_exports_status').on(table.status),
  ],
);

export type RgpdExport = typeof rgpdExports.$inferSelect;
export type NewRgpdExport = typeof rgpdExports.$inferInsert;
