import { describe, expect, it } from 'vitest';
import { daysAgo } from './date-windows';

describe('daysAgo', () => {
  it('subtracts exactly N days in ms', () => {
    const ref = new Date('2026-05-28T12:00:00.000Z');
    const r1 = daysAgo(1, ref);
    expect(r1.toISOString()).toBe('2026-05-27T12:00:00.000Z');
    const r7 = daysAgo(7, ref);
    expect(r7.toISOString()).toBe('2026-05-21T12:00:00.000Z');
  });

  it('crosses month boundaries correctly', () => {
    const ref = new Date('2026-05-03T08:00:00.000Z');
    expect(daysAgo(7, ref).toISOString()).toBe('2026-04-26T08:00:00.000Z');
  });

  it('handles fractional days', () => {
    const ref = new Date('2026-05-28T12:00:00.000Z');
    expect(daysAgo(0.5, ref).toISOString()).toBe('2026-05-28T00:00:00.000Z');
  });
});
