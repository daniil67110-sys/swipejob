/**
 * audit_logs — RGPD audit trail, APPEND-ONLY (Story 6.5).
 *
 * Append-only enforcé au niveau Postgres via trigger (migration 0020) :
 * - UPDATE bloqué sauf si la session a `set_config('audit_logs.allow_modify','true',true)`
 *   (utilisé uniquement par le job RGPD pour anonymiser actor_id après purge).
 * - DELETE bloqué pour rows < 13 mois (rétention CNIL NFR-S7).
 *
 * Aucune PII en clair :
 * - `actor_id` est l'ID interne (anonymisé à `anon_<hmac16>` après purge RGPD).
 * - `ip_hashed` / `user_agent_hashed` sont des HMAC SHA-256 16 chars (clé AUDIT_USER_HASH_SECRET).
 * - `metadata` passe par `redactPII()` côté `auditLog()` helper.
 */
import { index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { users } from './users.js';

export const actorType = pgEnum('actor_type', ['USER', 'SYSTEM', 'ADMIN']);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    // F-009 : pas de default — callers DOIVENT spécifier explicitement le type d'acteur.
    actorType: actorType('actor_type').notNull(),
    event: text('event').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    // F-021 : pas de default {} — null est plus expressif pour les events sans metadata.
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    // Story 6.5 — IP et UA stockés en HMAC SHA-256 (16 hex chars) pour conformité CNIL.
    ipHashed: text('ip_hashed'),
    userAgentHashed: text('user_agent_hashed'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_actor_id').on(table.actorId),
    index('idx_audit_logs_event').on(table.event),
    index('idx_audit_logs_created_at').on(table.createdAt),
    // F-011 : requêtes RGPD "tous events liés à cet objet" doivent être indexées.
    index('idx_audit_logs_target_id').on(table.targetId),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
