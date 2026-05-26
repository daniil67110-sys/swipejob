import { describe, expect, it } from 'vitest';
import { buildOfferSlug, buildOfferUrl, extractOfferId } from './offer-slug';

describe('buildOfferSlug', () => {
  it('kebab-cases French titles with accents', () => {
    expect(buildOfferSlug('Développeur Front-End H/F', 'abc123')).toBe(
      'developpeur-front-end-h-f-abc123',
    );
  });

  it('truncates long titles to ~60 chars + id', () => {
    const long = 'A'.repeat(120);
    const slug = buildOfferSlug(long, 'xyz789');
    expect(slug.length).toBeLessThanOrEqual(60 + 1 + 6);
    expect(slug.endsWith('-xyz789')).toBe(true);
  });

  it('falls back to id only when title is empty after slugify', () => {
    expect(buildOfferSlug('!!!', 'id1')).toBe('id1');
    expect(buildOfferSlug('', 'id1')).toBe('id1');
  });

  it('strips trailing dashes from the title segment', () => {
    expect(buildOfferSlug('Job ?', 'id1')).toBe('job-id1');
  });
});

describe('extractOfferId', () => {
  it('returns the trailing segment after the last dash', () => {
    expect(extractOfferId('developpeur-front-end-abc123')).toBe('abc123');
  });

  it('returns the slug itself if no dash', () => {
    expect(extractOfferId('abc123')).toBe('abc123');
  });

  it('rejects empty / non-alphanumeric ids', () => {
    expect(extractOfferId('')).toBeNull();
    expect(extractOfferId('title-')).toBeNull();
    expect(extractOfferId('title-abc!')).toBeNull();
  });
});

describe('buildOfferUrl', () => {
  it('strips trailing slash on siteUrl', () => {
    expect(buildOfferUrl('https://swipejob.fr/', 'Dev', 'abc')).toBe(
      'https://swipejob.fr/offres/dev-abc',
    );
  });

  it('handles SITE_URL without trailing slash', () => {
    expect(buildOfferUrl('https://swipejob.fr', 'Dev', 'abc')).toBe(
      'https://swipejob.fr/offres/dev-abc',
    );
  });
});
