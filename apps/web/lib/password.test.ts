/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { hashPassword, verifyPassword, verifyPasswordTimingSafe } from './password';

describe('password', () => {
  it('hashPassword produces an argon2id hash', async () => {
    const h = await hashPassword('MyStrongPass123');
    expect(h.startsWith('$argon2id$')).toBe(true);
    expect(h.length).toBeGreaterThan(50);
  });

  it('produces different hashes for the same input (random salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('samepass1'), hashPassword('samepass1')]);
    expect(a).not.toBe(b);
  });

  it('verifyPassword returns true for the right plain', async () => {
    const h = await hashPassword('AnotherPass456');
    expect(await verifyPassword(h, 'AnotherPass456')).toBe(true);
  });

  it('verifyPassword returns false for the wrong plain', async () => {
    const h = await hashPassword('AnotherPass456');
    expect(await verifyPassword(h, 'WrongPass456')).toBe(false);
  });

  it('verifyPassword returns false on malformed hash', async () => {
    expect(await verifyPassword('not-a-hash', 'anything')).toBe(false);
  });

  it('verifyPasswordTimingSafe returns false when hash is null', async () => {
    expect(await verifyPasswordTimingSafe(null, 'anypass')).toBe(false);
  });

  it('verifyPasswordTimingSafe returns true when hash matches', async () => {
    const h = await hashPassword('TimingTest789');
    expect(await verifyPasswordTimingSafe(h, 'TimingTest789')).toBe(true);
  });
}, 30_000);
