import { describe, expect, it } from 'vitest';
import { _internals } from './inactivity.js';

const { monthsAgo } = _internals;

describe('monthsAgo', () => {
  it('returns a date N months earlier in UTC', () => {
    const now = new Date('2026-05-27T12:00:00Z');
    const r = monthsAgo(24, now);
    expect(r.toISOString()).toBe('2024-05-27T12:00:00.000Z');
  });

  it('handles month rollover correctly', () => {
    const now = new Date('2026-01-15T08:00:00Z');
    const r = monthsAgo(2, now);
    expect(r.toISOString()).toBe('2025-11-15T08:00:00.000Z');
  });

  it('does not mutate the input', () => {
    const now = new Date('2026-05-27T12:00:00Z');
    const before = now.toISOString();
    monthsAgo(24, now);
    expect(now.toISOString()).toBe(before);
  });
});
