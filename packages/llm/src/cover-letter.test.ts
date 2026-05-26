import { describe, expect, it } from 'vitest';
import { generateCoverLetter, sanitizeLetter } from './cover-letter.js';

describe('sanitizeLetter', () => {
  it('strips HTML tags', () => {
    expect(sanitizeLetter('<p>Bonjour</p>')).toBe('Bonjour');
  });

  it('strips code fences', () => {
    expect(sanitizeLetter('```\nBonjour\n```')).toBe('Bonjour');
  });

  it('replaces straight quotes by typographic ones', () => {
    expect(sanitizeLetter("L'entreprise")).toBe('L’entreprise');
  });

  it('trims whitespace', () => {
    expect(sanitizeLetter('  Bonjour  ')).toBe('Bonjour');
  });
});

describe('generateCoverLetter fallback', () => {
  const input = {
    studentName: 'Alice Martin',
    studentSkills: ['React', 'TypeScript'],
    studentHeadline: 'Étudiante en informatique',
    studentSummary: 'Passionnée par le web',
    jobTitle: 'Développeuse front-end',
    companyName: 'Acme',
    jobDescription: 'Une super offre',
    jobCity: 'Paris',
  };

  it('returns fallback template when Mistral is not configured', async () => {
    const res = await generateCoverLetter(input, {
      mistralApiKey: null,
      mistralModel: 'mistral-large-latest',
    });
    expect(res.status).toBe('template_fallback');
    expect(res.meta.provider).toBe('fallback');
    expect(res.text).toContain('Alice Martin');
    expect(res.text).toContain('Développeuse front-end');
    expect(res.text).toContain('Acme');
  });

  it('hashes the prompt and never leaks it', async () => {
    const res = await generateCoverLetter(input, {
      mistralApiKey: null,
      mistralModel: 'mistral-large-latest',
    });
    expect(res.meta.promptHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
