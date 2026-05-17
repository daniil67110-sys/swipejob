export * from './users.js';
export * from './accounts.js';
export * from './sessions.js';
export * from './verification-tokens.js';
export * from './profiles.js';
export * from './audit-logs.js';
export * from './ia-audit-logs.js';

import { accounts } from './accounts.js';
import { auditLogs } from './audit-logs.js';
import { iaAuditLogs } from './ia-audit-logs.js';
import { profiles } from './profiles.js';
import { sessions } from './sessions.js';
import { users } from './users.js';
import { verificationTokens } from './verification-tokens.js';

export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  profiles,
  auditLogs,
  iaAuditLogs,
} as const;

export type Schema = typeof schema;
