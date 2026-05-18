/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only (Vitest n'a pas le contexte React Server Components)
vi.mock('server-only', () => ({}));

// Mock @swipejob/db client
const insertedRows: Array<Record<string, unknown>> = [];
vi.mock('@swipejob/db', () => ({
  db: {
    insert: () => ({
      values: async (row: Record<string, unknown>) => {
        insertedRows.push(row);
      },
    }),
  },
  isDatabaseConfigured: true,
}));

vi.mock('@swipejob/db/schema', () => ({
  auditLogs: { _: { name: 'audit_logs' } },
}));

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (k: string) => (k === 'x-forwarded-for' ? '1.2.3.4' : k === 'user-agent' ? 'test' : null),
  }),
}));

vi.mock('./logger.server', () => ({
  serverLogger: { warn: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  insertedRows.length = 0;
});

describe('auditLog', () => {
  it('inserts an audit log row with correct fields', async () => {
    const { auditLog } = await import('./audit');
    await auditLog({
      actorId: 'user_123',
      actorType: 'USER',
      event: 'auth.signup',
      targetType: 'user',
      targetId: 'user_123',
      metadata: { method: 'google' },
    });
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0]?.['event']).toBe('auth.signup');
    expect(insertedRows[0]?.['actorId']).toBe('user_123');
  });

  it('redacts PII fields in metadata', async () => {
    const { auditLog } = await import('./audit');
    await auditLog({
      actorType: 'USER',
      event: 'profile.updated',
      metadata: { email: 'test@example.com', password: 'secret', age: 25 },
    });
    const meta = insertedRows[insertedRows.length - 1]?.['metadata'] as Record<string, unknown>;
    expect(meta['email']).toMatch(/^sha256:/);
    expect(meta['password']).toBe('[REDACTED]');
    expect(meta['age']).toBe(25);
  });
});
