import { describe, expect, it } from 'vitest';
import {
  actorType,
  authSource,
  consentStatus,
  cvParsingStatus,
  parentalConsentStatus,
  schema,
  userRole,
} from './index.js';

describe('schema export', () => {
  it('exposes the 10 expected tables', () => {
    expect(Object.keys(schema).sort()).toEqual(
      [
        'accounts',
        'auditLogs',
        'cvs',
        'iaAuditLogs',
        'parentalConsents',
        'preferences',
        'profiles',
        'sessions',
        'users',
        'verificationTokens',
      ].sort(),
    );
  });
});

describe('enum exports', () => {
  it('exposes the 6 expected enums', () => {
    expect(userRole).toBeDefined();
    expect(authSource).toBeDefined();
    expect(consentStatus).toBeDefined();
    expect(actorType).toBeDefined();
    expect(parentalConsentStatus).toBeDefined();
    expect(cvParsingStatus).toBeDefined();
  });
});
