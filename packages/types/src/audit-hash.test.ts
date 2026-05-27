import { describe, expect, it } from 'vitest';
import { hashAuditValue } from './audit-hash.js';

describe('hashAuditValue', () => {
  const secret = 'a-test-secret-with-enough-entropy-32+';

  it('returns null for empty/null/undefined input', () => {
    expect(hashAuditValue(null, secret)).toBeNull();
    expect(hashAuditValue(undefined, secret)).toBeNull();
    expect(hashAuditValue('', secret)).toBeNull();
  });

  it('returns a 16-char lowercase hex string for non-empty input', () => {
    const out = hashAuditValue('203.0.113.42', secret);
    expect(out).toMatch(/^[0-9a-f]{16}$/);
  });

  it('is deterministic for the same secret', () => {
    const a = hashAuditValue('Mozilla/5.0', secret);
    const b = hashAuditValue('Mozilla/5.0', secret);
    expect(a).toBe(b);
  });

  it('differs across distinct inputs (collision-resistant within 16 hex)', () => {
    const a = hashAuditValue('1.1.1.1', secret);
    const b = hashAuditValue('1.1.1.2', secret);
    expect(a).not.toBe(b);
  });

  it('differs across distinct secrets', () => {
    const a = hashAuditValue('Mozilla/5.0', 'secret-A');
    const b = hashAuditValue('Mozilla/5.0', 'secret-B');
    expect(a).not.toBe(b);
  });

  it('falls back when secret empty (does not crash)', () => {
    const out = hashAuditValue('1.1.1.1', '');
    expect(out).toMatch(/^[0-9a-f]{16}$/);
  });
});
