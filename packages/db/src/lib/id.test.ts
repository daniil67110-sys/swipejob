import { describe, expect, it } from 'vitest';
import { createId } from './id.js';

describe('createId', () => {
  it('produces a 24-char lowercase alphanumeric cuid2', () => {
    const id = createId();
    expect(id).toMatch(/^[a-z0-9]{24}$/);
  });

  it('produces unique IDs across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()));
    expect(ids.size).toBe(100);
  });
});
