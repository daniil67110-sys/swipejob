/**
 * Story 6.8 — Tickets de signalement d'accessibilité (RGAA / NFR-A7).
 *
 * Append depuis le formulaire public `/declaration-accessibilite`, consulté par
 * l'équipe (story 8.x admin). Pas de FK sur users : un visiteur non connecté
 * doit pouvoir signaler.
 *
 * Statut lifecycle :
 *  - `open` : nouveau ticket (default)
 *  - `acknowledged` : équipe a lu, en cours
 *  - `resolved` : fix livré
 *  - `wontfix` : non corrigible ou hors scope (avec commentaire admin)
 */
import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';

export const accessibilityReportStatus = pgEnum('accessibility_report_status', [
  'open',
  'acknowledged',
  'resolved',
  'wontfix',
]);

export const accessibilityReports = pgTable(
  'accessibility_reports',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    /** URL concernée par le défaut. Texte libre (peut être incomplet). */
    url: text('url').notNull(),
    /** Description libre du problème rencontré. */
    description: text('description').notNull(),
    /** Email de contact optionnel (rappel possible). */
    contactEmail: text('contact_email'),
    /** Status admin lifecycle. */
    status: accessibilityReportStatus('status').notNull().default('open'),
    /** Notes admin internes (résolution, suivi). */
    adminNotes: text('admin_notes'),
    /** IP hashée (cohérence avec audit_logs Story 6.5) pour détection abus. */
    reporterIpHashed: text('reporter_ip_hashed'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_accessibility_reports_status').on(table.status),
    index('idx_accessibility_reports_created_at').on(table.createdAt),
  ],
);

export type AccessibilityReport = typeof accessibilityReports.$inferSelect;
export type NewAccessibilityReport = typeof accessibilityReports.$inferInsert;
