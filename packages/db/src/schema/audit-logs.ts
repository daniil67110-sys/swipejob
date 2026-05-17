/**
 * audit_logs — RGPD audit trail, APPEND-ONLY.
 *
 * Convention : aucune opération UPDATE/DELETE autorisée (enforced par convention
 * dans le code via helpers `auditLog()` qui n'exposent que insert).
 * V2 : ajout d'un trigger Postgres + role read-only séparé.
 *
 * IMPORTANT : `metadata` ne doit JAMAIS contenir de PII en clair —
 * passer par `redactPII()` de `@swipejob/types` avant insert.
 */
import { index, inet, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
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
    // F-009 : pas de default — callers DOIVENT spécifier explicitement le type d'acteur
    // (évite que des events SYSTEM soient mal tagués USER).
    actorType: actorType('actor_type').notNull(),
    event: text('event').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    // F-021 : pas de default {} — null est plus expressif pour les events sans metadata.
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
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
