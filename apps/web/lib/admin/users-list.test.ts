import { describe, expect, it } from 'vitest';
import { parsePage, parseSearchQuery, parseUserStatus } from './users-list-params';

describe('parseUserStatus', () => {
  it('returns valid status values', () => {
    expect(parseUserStatus('all')).toBe('all');
    expect(parseUserStatus('active')).toBe('active');
    expect(parseUserStatus('anonymized')).toBe('anonymized');
    expect(parseUserStatus('deleted')).toBe('deleted');
  });

  it('falls back to "all" for unknown / undefined input', () => {
    expect(parseUserStatus(undefined)).toBe('all');
    expect(parseUserStatus('')).toBe('all');
    expect(parseUserStatus('foo')).toBe('all');
    expect(parseUserStatus('ACTIVE')).toBe('all'); // case-sensitive on purpose
  });
});

describe('parsePage', () => {
  it('returns 1 for undefined / non-numeric / < 1', () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage('abc')).toBe(1);
    expect(parsePage('-3')).toBe(1);
    expect(parsePage('0')).toBe(1);
  });

  it('parses valid positive integers', () => {
    expect(parsePage('5')).toBe(5);
    expect(parsePage('42')).toBe(42);
  });

  it('caps to 10_000 to prevent DoS via OFFSET', () => {
    expect(parsePage('999999')).toBe(10000);
  });
});

describe('parseSearchQuery', () => {
  it('returns undefined for empty / undefined / too short', () => {
    expect(parseSearchQuery(undefined)).toBeUndefined();
    expect(parseSearchQuery('')).toBeUndefined();
    expect(parseSearchQuery('a')).toBeUndefined();
    expect(parseSearchQuery('  ')).toBeUndefined();
  });

  it('trims and lowercases valid input', () => {
    expect(parseSearchQuery('  Foo  ')).toBe('foo');
    expect(parseSearchQuery('OKSANA@gmail.com')).toBe('oksana@gmail.com');
  });
});
