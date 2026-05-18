/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { compositeSimilarity, jaroWinklerSimilarity, normalizeForFuzzy } from './dedupe.js';

describe('normalizeForFuzzy', () => {
  it('lowercases + strips accents + ponctuation', () => {
    expect(normalizeForFuzzy('Stage Marketing!! ')).toBe('stage marketing');
    expect(normalizeForFuzzy('École Polytechnique - Paris')).toBe('ecole polytechnique paris');
  });

  it('handles null/empty', () => {
    expect(normalizeForFuzzy(null)).toBe('');
    expect(normalizeForFuzzy('')).toBe('');
  });

  it('collapses whitespace', () => {
    expect(normalizeForFuzzy('a    b\nc')).toBe('a b c');
  });
});

describe('jaroWinklerSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(jaroWinklerSimilarity('Acme', 'Acme')).toBe(1);
  });

  it('handles accents via normalization', () => {
    expect(jaroWinklerSimilarity('Acmé Corp', 'Acme Corp')).toBeGreaterThan(0.95);
  });

  it('returns >0.9 for very similar strings', () => {
    expect(jaroWinklerSimilarity('Acme Corp', 'Acme Corporation')).toBeGreaterThan(0.85);
  });

  it('returns low score for unrelated strings', () => {
    expect(jaroWinklerSimilarity('Acme', 'Zebra')).toBeLessThan(0.5);
  });
});

describe('compositeSimilarity', () => {
  const base = {
    id: 'a',
    title: 'Stage Marketing Digital',
    companyName: 'Acme Corp',
    locationCity: 'Paris',
    contractType: 'stage',
  };

  it('returns near 1 for near-identical offers', () => {
    const b = {
      ...base,
      id: 'b',
      title: 'Stage en Marketing Digital',
      companyName: 'Acme Corporation',
      locationCity: 'Paris',
    };
    const score = compositeSimilarity(base, b);
    expect(score).toBeGreaterThan(0.85);
  });

  it('returns 0 when contractType differs', () => {
    const b = { ...base, id: 'b', contractType: 'alternance' };
    expect(compositeSimilarity(base, b)).toBe(0);
  });

  it('returns low score for unrelated offers', () => {
    const b = {
      id: 'b',
      title: 'Développeur Backend',
      companyName: 'Tech SAS',
      locationCity: 'Lyon',
      contractType: 'stage',
    };
    expect(compositeSimilarity(base, b)).toBeLessThan(0.6);
  });

  it('handles null companyName/city gracefully', () => {
    const b = {
      id: 'b',
      title: 'Stage Marketing Digital',
      companyName: null,
      locationCity: null,
      contractType: 'stage',
    };
    const score = compositeSimilarity(base, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.85); // pas assez d'info pour passer le threshold
  });
});
