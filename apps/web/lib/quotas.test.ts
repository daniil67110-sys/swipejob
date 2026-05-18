/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getSwipeQuota, ADULT_DAILY_QUOTA, MINOR_DAILY_QUOTA } from './quotas';

describe('getSwipeQuota', () => {
  const today = new Date();

  it('returns 0 when birthDate is null', () => {
    expect(getSwipeQuota({ birthDate: null })).toBe(0);
  });

  it('returns 0 for under-13', () => {
    const birth = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    expect(getSwipeQuota({ birthDate: birth })).toBe(0);
  });

  it('returns MINOR_DAILY_QUOTA for 13-17', () => {
    const birth = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
    expect(getSwipeQuota({ birthDate: birth })).toBe(MINOR_DAILY_QUOTA);
  });

  it('returns ADULT_DAILY_QUOTA for >= 18', () => {
    const birth = new Date(today.getFullYear() - 22, today.getMonth(), today.getDate());
    expect(getSwipeQuota({ birthDate: birth })).toBe(ADULT_DAILY_QUOTA);
  });

  it('accepts a string birthDate', () => {
    const dateStr = `${today.getFullYear() - 22}-01-01`;
    expect(getSwipeQuota({ birthDate: dateStr })).toBe(ADULT_DAILY_QUOTA);
  });
});
