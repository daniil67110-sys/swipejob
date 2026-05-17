/**
 * ia_audit_logs — IA Act explicabilité, APPEND-ONLY.
 *
 * Trace toutes les inférences LLM/IA pour audit réglementaire et explicabilité.
 * `prompt_hash` : sha256 hex string (64 chars). JAMAIS le prompt en clair (PII risk).
 * Helper attendu : `crypto.createHash('sha256').update(prompt).digest('hex')`.
 */
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { users } from './users.js';

export const iaAuditLogs = pgTable(
  'ia_audit_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    model: text('model').notNull(),
    provider: text('provider').notNull(),
    promptHash: text('prompt_hash').notNull(),
    featureType: text('feature_type').notNull(),
    // F-006 : bigint au lieu d'integer pour éviter overflow > 2.1B ms (~25 jours).
    latencyMs: bigint('latency_ms', { mode: 'number' }).notNull(),
    tokensInput: integer('tokens_input'),
    tokensOutput: integer('tokens_output'),
    success: boolean('success').notNull(),
    errorCode: text('error_code'),
    // F-021 : pas de default {} — null est plus expressif.
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_ia_audit_logs_user_id').on(table.userId),
    index('idx_ia_audit_logs_feature_type').on(table.featureType),
    index('idx_ia_audit_logs_created_at').on(table.createdAt),
    // F-012 : requêtes analytics "toutes inférences Mistral du mois" indexées.
    index('idx_ia_audit_logs_model').on(table.model),
  ],
);

export type IaAuditLog = typeof iaAuditLogs.$inferSelect;
export type NewIaAuditLog = typeof iaAuditLogs.$inferInsert;
