import { describe, expect, it } from 'vitest';
import { generateReferralCode, sanitizeReferralCode } from './referral-codes';

describe('generateReferralCode', () => {
  it('returns a 6 char uppercase alphanumeric code', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z2-9]+$/);
    }
  });

  it('excludes ambiguous characters (O 0 I 1 L U)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateReferralCode();
      expect(code).not.toMatch(/[O0I1LU]/);
    }
  });
});

describe('sanitizeReferralCode', () => {
  it('uppercases and trims valid codes', () => {
    expect(sanitizeReferralCode('  abc234  ')).toBe('ABC234');
  });

  it('rejects wrong length', () => {
    expect(sanitizeReferralCode('ABC')).toBeNull();
    expect(sanitizeReferralCode('TOOLONGCODE')).toBeNull();
  });

  it('rejects non alphanumeric', () => {
    expect(sanitizeReferralCode('AB-C23')).toBeNull();
    expect(sanitizeReferralCode('AB C23')).toBeNull();
  });

  it('rejects non strings', () => {
    expect(sanitizeReferralCode(123 as unknown)).toBeNull();
    expect(sanitizeReferralCode(undefined)).toBeNull();
    expect(sanitizeReferralCode(null)).toBeNull();
  });
});
