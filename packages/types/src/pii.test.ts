import { describe, expect, it } from 'vitest';
import { hashEmail, redactPII } from './pii.js';

describe('hashEmail', () => {
  it('produces a stable 16-char hex digest case-insensitive', () => {
    const a = hashEmail('Foo@Bar.com');
    const b = hashEmail('foo@bar.com');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe('redactPII', () => {
  it('masks password but hashes email', () => {
    const result = redactPII({ email: 'a@b.c', password: 'secret', userId: 'u_1' });
    expect(result.password).toBe('[REDACTED]');
    expect(result.email).toMatch(/^sha256:[a-f0-9]{16}$/);
    expect(result.userId).toBe('u_1');
  });

  it('redacts nested PII recursively', () => {
    const result = redactPII({
      profile: { firstName: 'Alice', lastName: 'Dupont', age: 25 },
      contacts: [{ email: 'x@y.z' }],
    });
    expect(result.profile.firstName).toBe('[REDACTED]');
    expect(result.profile.lastName).toBe('[REDACTED]');
    expect(result.profile.age).toBe(25);
    const firstContact = result.contacts[0];
    expect(firstContact?.email).toMatch(/^sha256:/);
  });

  it('passes through primitives and null', () => {
    expect(redactPII(null)).toBeNull();
    expect(redactPII(42)).toBe(42);
    expect(redactPII('hello')).toBe('hello');
  });
});
