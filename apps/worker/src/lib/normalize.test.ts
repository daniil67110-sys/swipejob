/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import {
  computeQualityScore,
  extractContactEmail,
  extractPublishedAt,
  extractSourceUrl,
  normalizeOffer,
} from './normalize.js';

describe('extractContactEmail', () => {
  it('finds an email in a description', () => {
    expect(extractContactEmail('Contact: john.doe@example.fr')).toBe('john.doe@example.fr');
  });

  it('returns null on no match', () => {
    expect(extractContactEmail('Description sans email.')).toBeNull();
  });

  it('returns null on empty/null', () => {
    expect(extractContactEmail(null)).toBeNull();
    expect(extractContactEmail('')).toBeNull();
  });

  it('lowercases the result', () => {
    expect(extractContactEmail('Mail: John.Doe@Example.FR')).toBe('john.doe@example.fr');
  });
});

describe('extractSourceUrl', () => {
  it('returns Adzuna redirect_url from payload', () => {
    const payload = { redirect_url: 'https://adzuna.com/job/abc' };
    expect(extractSourceUrl(payload, 'adzuna', 'abc')).toBe('https://adzuna.com/job/abc');
  });

  it('builds France Travail URL from externalId', () => {
    expect(extractSourceUrl({}, 'france-travail', 'FT-123')).toBe(
      'https://candidat.francetravail.fr/offres/recherche/detail/FT-123',
    );
  });

  it('returns null for unknown source', () => {
    expect(extractSourceUrl({}, 'unknown', 'id')).toBeNull();
  });
});

describe('extractPublishedAt', () => {
  it('parses ISO from Adzuna `created`', () => {
    const date = extractPublishedAt({ created: '2025-05-01T10:00:00Z' }, 'adzuna');
    expect(date).toBeInstanceOf(Date);
    expect(date!.toISOString()).toBe('2025-05-01T10:00:00.000Z');
  });

  it('parses France Travail `dateCreation`', () => {
    const date = extractPublishedAt({ dateCreation: '2025-05-02T12:00:00Z' }, 'france-travail');
    expect(date!.toISOString()).toBe('2025-05-02T12:00:00.000Z');
  });

  it('returns null on invalid date', () => {
    expect(extractPublishedAt({ created: 'not-a-date' }, 'adzuna')).toBeNull();
  });
});

describe('computeQualityScore', () => {
  const baseOffer = {
    title: 'Stage Dev',
    description:
      'Description longue assez longue pour passer le check de 50 caractères minimum yep.',
    companyName: 'Acme',
    locationCity: 'Paris',
    locationLat: 48.86,
    locationLng: 2.35,
    salaryMinMonthly: 800,
    salaryMaxMonthly: 1200,
    contractType: 'stage' as const,
    publishedAt: new Date(),
  };

  it('returns 1.0 (capped) for a complete offer', () => {
    const score = computeQualityScore(baseOffer);
    expect(score).toBeGreaterThanOrEqual(0.9);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('returns 0 if title missing', () => {
    expect(computeQualityScore({ ...baseOffer, title: '' })).toBe(0);
  });

  it('returns lower score for minimal offer', () => {
    const minimal = {
      title: 'Stage',
      description: null,
      companyName: null,
      locationCity: null,
      locationLat: null,
      locationLng: null,
      salaryMinMonthly: null,
      salaryMaxMonthly: null,
      contractType: null,
      publishedAt: null,
    };
    const score = computeQualityScore(minimal);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.6);
  });
});

describe('normalizeOffer (integration)', () => {
  it('returns full normalization for Adzuna', () => {
    const offer = {
      title: 'Stage Marketing',
      description: 'Contact: hr@acme.com pour postuler. Stage 6 mois Paris.',
      companyName: 'Acme',
      locationCity: 'Paris',
      locationLat: 48.86,
      locationLng: 2.35,
      salaryMinMonthly: 600,
      salaryMaxMonthly: 1000,
      contractType: 'stage',
      externalId: 'adz-1',
      rawPayload: {
        redirect_url: 'https://adzuna.com/job/adz-1',
        created: '2025-05-01T08:00:00Z',
      },
    };
    const result = normalizeOffer(offer, 'adzuna');
    expect(result.qualityScore).toBeGreaterThan(0.6);
    expect(result.sourceUrl).toBe('https://adzuna.com/job/adz-1');
    expect(result.contactEmail).toBe('hr@acme.com');
    expect(result.publishedAt!.toISOString()).toBe('2025-05-01T08:00:00.000Z');
  });
});
