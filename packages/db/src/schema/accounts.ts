import { bigint, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { users } from './users.js';

export const accounts = pgTable(
  'accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: bigint('expires_at', { mode: 'number' }),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_accounts_provider_account_id').on(table.provider, table.providerAccountId),
    index('idx_accounts_user_id').on(table.userId),
  ],
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
