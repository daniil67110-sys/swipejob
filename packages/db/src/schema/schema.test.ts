import { describe, expect, it } from 'vitest';
import {
  actorType,
  applicationStatus,
  authSource,
  consentStatus,
  coverLetterStatus,
  cvParsingStatus,
  offerStatus,
  parentalConsentStatus,
  schema,
  swipeDirection,
  userRole,
} from './index.js';

describe('schema export', () => {
  it('exposes the 18 expected tables', () => {
    expect(Object.keys(schema).sort()).toEqual(
      [
        'accounts',
        'applicationEvents',
        'applications',
        'auditLogs',
        'cvs',
        'iaAuditLogs',
        'matchScores',
        'offerSources',
        'offers',
        'parentalConsents',
        'preferences',
        'profiles',
        'schools',
        'sessions',
        'swipeEvents',
        'users',
        'verificationTokens',
        'watchlist',
      ].sort(),
    );
  });
});

describe('enum exports', () => {
  it('exposes the 9 expected enums', () => {
    expect(userRole).toBeDefined();
    expect(authSource).toBeDefined();
    expect(consentStatus).toBeDefined();
    expect(actorType).toBeDefined();
    expect(parentalConsentStatus).toBeDefined();
    expect(cvParsingStatus).toBeDefined();
    expect(offerStatus).toBeDefined();
    expect(swipeDirection).toBeDefined();
    expect(applicationStatus).toBeDefined();
    expect(coverLetterStatus).toBeDefined();
  });
});
