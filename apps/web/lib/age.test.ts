/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { computeAge, categorizeAge } from './age';

describe('computeAge', () => {
  it('returns full years before birthday', () => {
    const today = new Date('2026-05-18');
    const birth = new Date('2010-06-01'); // 15 ans dans 13 jours
    expect(computeAge(birth, today)).toBe(15);
  });

  it('returns full years on birthday', () => {
    const today = new Date('2026-05-18');
    const birth = new Date('2010-05-18');
    expect(computeAge(birth, today)).toBe(16);
  });

  it('returns full years after birthday', () => {
    const today = new Date('2026-05-18');
    const birth = new Date('2010-04-01'); // 16 ans depuis avril
    expect(computeAge(birth, today)).toBe(16);
  });

  it('handles leap year birthdate (Feb 29)', () => {
    const today = new Date('2026-02-28');
    const birth = new Date('2008-02-29');
    // 28 fév 2026 → pas encore son anniversaire
    expect(computeAge(birth, today)).toBe(17);
  });
});

describe('categorizeAge', () => {
  it('< 13 → under_13', () => {
    expect(categorizeAge(0)).toBe('under_13');
    expect(categorizeAge(12)).toBe('under_13');
  });
  it('13-17 → minor', () => {
    expect(categorizeAge(13)).toBe('minor');
    expect(categorizeAge(17)).toBe('minor');
  });
  it('>= 18 → adult', () => {
    expect(categorizeAge(18)).toBe('adult');
    expect(categorizeAge(99)).toBe('adult');
  });
});
