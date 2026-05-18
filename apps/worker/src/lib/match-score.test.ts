/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_FEATURES,
  buildExplanation,
  compositeScore,
  computeEducationFit,
  computePrefFit,
} from './match-score.js';

describe('Story 2.9 — fairness: features whitelist', () => {
  it('only contains non-protected features', () => {
    // Whitelist explicite. Toute modif doit passer un audit fairness.
    expect(ALLOWED_FEATURES).toEqual([
      'cosine_skills',
      'pref_contract_type',
      'pref_city',
      'pref_work_mode',
      'pref_salary',
      'education_level',
    ]);
  });

  it('contains no protected attributes', () => {
    const forbidden = [
      'age',
      'gender',
      'sex',
      'origin',
      'nationality',
      'family_status',
      'health',
      'religion',
      'sexual_orientation',
      'political',
      'union',
      'disability',
      'race',
    ];
    for (const word of forbidden) {
      for (const allowed of ALLOWED_FEATURES) {
        expect(allowed.toLowerCase()).not.toContain(word);
      }
    }
  });
});

describe('computePrefFit', () => {
  const emptyPrefs = {
    contractTypes: [],
    cities: [],
    workModes: [],
    salaryMinMonthly: null,
    salaryMaxMonthly: null,
  };
  const offer = {
    id: 'o1',
    contractType: 'stage',
    locationCity: 'Paris',
    remoteMode: 'hybrid',
    salaryMinMonthly: 800,
    salaryMaxMonthly: 1200,
  };

  it('returns 0.5 neutral when no preferences set', () => {
    expect(computePrefFit(emptyPrefs, offer)).toBe(0.5);
  });

  it('returns 1.0 when all preferences match', () => {
    const prefs = {
      contractTypes: ['stage'],
      cities: ['Paris'],
      workModes: ['hybrid'],
      salaryMinMonthly: 500,
      salaryMaxMonthly: 1500,
    };
    expect(computePrefFit(prefs, offer)).toBeCloseTo(1, 2);
  });

  it('returns partial score on partial match', () => {
    const prefs = {
      contractTypes: ['stage'],
      cities: ['Lyon'],
      workModes: [],
      salaryMinMonthly: null,
      salaryMaxMonthly: null,
    };
    // contractType match (0.4), city no match (0.3) → 0.4/0.7 ≈ 0.57
    const score = computePrefFit(prefs, offer);
    expect(score).toBeGreaterThan(0.4);
    expect(score).toBeLessThan(0.7);
  });

  it('handles city case-insensitive', () => {
    const prefs = { ...emptyPrefs, cities: ['PARIS'] };
    const score = computePrefFit(prefs, offer);
    expect(score).toBeGreaterThan(0.5);
  });
});

describe('computeEducationFit', () => {
  it('returns 1 when offer requires user level', () => {
    expect(computeEducationFit('Master', ['Master', 'Doctorat'])).toBe(1);
  });

  it('returns 0 when explicit mismatch', () => {
    expect(computeEducationFit('BTS/DUT', ['Master', 'Doctorat'])).toBe(0);
  });

  it('returns 0.5 when offer does not specify', () => {
    expect(computeEducationFit('Master', null)).toBe(0.5);
    expect(computeEducationFit('Master', [])).toBe(0.5);
  });

  it('returns 0.5 when user level missing', () => {
    expect(computeEducationFit(null, ['Master'])).toBe(0.5);
  });
});

describe('compositeScore', () => {
  it('returns 100 for perfect match', () => {
    expect(compositeScore(1, 1, 1)).toBe(100);
  });

  it('returns 0 for no match', () => {
    expect(compositeScore(0, 0, 0)).toBe(0);
  });

  it('weights cosine 60%, prefs 25%, edu 15%', () => {
    // 1.0 cosine, 0 prefs, 0 edu → 60
    expect(compositeScore(1, 0, 0)).toBe(60);
    expect(compositeScore(0, 1, 0)).toBe(25);
    expect(compositeScore(0, 0, 1)).toBe(15);
  });

  it('clamps to 0-100', () => {
    expect(compositeScore(2, 2, 2)).toBe(100);
    expect(compositeScore(-1, -1, -1)).toBe(0);
  });
});

describe('buildExplanation', () => {
  it('always includes cosine_skills', () => {
    const explained = buildExplanation({
      cosineSim: 0.8,
      prefs: {
        contractTypes: [],
        cities: [],
        workModes: [],
        salaryMinMonthly: null,
        salaryMaxMonthly: null,
      },
      offer: {
        id: 'o1',
        contractType: null,
        locationCity: null,
        remoteMode: null,
        salaryMinMonthly: null,
        salaryMaxMonthly: null,
      },
      userEducationLevel: null,
      offerEducationLevels: null,
    });
    const factors = explained.map((e) => e.factor);
    expect(factors).toContain('cosine_skills');
    expect(factors).toContain('education_level');
  });

  it('only uses allowed features', () => {
    const explained = buildExplanation({
      cosineSim: 0.5,
      prefs: {
        contractTypes: ['stage'],
        cities: ['Paris'],
        workModes: [],
        salaryMinMonthly: null,
        salaryMaxMonthly: null,
      },
      offer: {
        id: 'o1',
        contractType: 'stage',
        locationCity: 'Paris',
        remoteMode: null,
        salaryMinMonthly: null,
        salaryMaxMonthly: null,
      },
      userEducationLevel: 'Master',
      offerEducationLevels: ['Master'],
    });
    for (const feature of explained) {
      expect(ALLOWED_FEATURES).toContain(feature.factor);
    }
  });
});
