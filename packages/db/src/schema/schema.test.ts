import { describe, expect, it } from 'vitest';
import { actorType, authSource, consentStatus, schema, userRole } from './index.js';

describe('schema export', () => {
  it('exposes the 7 expected tables', () => {
    expect(Object.keys(schema).sort()).toEqual(
      [
        'accounts',
        'auditLogs',
        'iaAuditLogs',
        'profiles',
        'sessions',
        'users',
        'verificationTokens',
      ].sort(),
    );
  });
});

describe('enum exports', () => {
  it('exposes the 4 expected enums', () => {
    expect(userRole).toBeDefined();
    expect(authSource).toBeDefined();
    expect(consentStatus).toBeDefined();
    expect(actorType).toBeDefined();
  });
});
