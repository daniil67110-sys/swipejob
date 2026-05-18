import { describe, expect, it } from 'vitest';
import {
  actorType,
  authSource,
  consentStatus,
  parentalConsentStatus,
  schema,
  userRole,
} from './index.js';

describe('schema export', () => {
  it('exposes the 8 expected tables', () => {
    expect(Object.keys(schema).sort()).toEqual(
      [
        'accounts',
        'auditLogs',
        'iaAuditLogs',
        'parentalConsents',
        'profiles',
        'sessions',
        'users',
        'verificationTokens',
      ].sort(),
    );
  });
});

describe('enum exports', () => {
  it('exposes the 5 expected enums', () => {
    expect(userRole).toBeDefined();
    expect(authSource).toBeDefined();
    expect(consentStatus).toBeDefined();
    expect(actorType).toBeDefined();
    expect(parentalConsentStatus).toBeDefined();
  });
});
