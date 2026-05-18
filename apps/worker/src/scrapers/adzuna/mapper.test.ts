/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { mapAdzunaToOffer } from './mapper.js';
import type { AdzunaOfferRaw } from './client.js';

const SOURCE_ID = 'src_test_adzuna';

const base: AdzunaOfferRaw = {
  id: 'adz-1',
  title: 'Stage Marketing 6 mois',
  description: 'Stage de 6 mois en équipe marketing.',
  company: { display_name: 'Acme' },
  location: { area: ['France', 'Île-de-France', 'Paris', 'Paris'], display_name: 'Paris' },
  latitude: 48.86,
  longitude: 2.35,
  salary_min: 7200, // 600€/mois annuel
  salary_max: 14400, // 1200€/mois annuel
  salary_is_predicted: '0',
};

describe('mapAdzunaToOffer', () => {
  it('infers contractType=stage from title', () => {
    const result = mapAdzunaToOffer(base, SOURCE_ID);
    expect(result).not.toBeNull();
    expect(result!.contractType).toBe('stage');
  });

  it('infers contractType=alternance from title', () => {
    const offer = { ...base, title: 'Alternance Dev Web 12 mois' };
    const result = mapAdzunaToOffer(offer, SOURCE_ID);
    expect(result!.contractType).toBe('alternance');
  });

  it('infers alternance from apprenti keyword', () => {
    const offer = { ...base, title: 'Apprenti développeur', description: '' };
    const result = mapAdzunaToOffer(offer, SOURCE_ID);
    expect(result!.contractType).toBe('alternance');
  });

  it('returns null for CDI/CDD (not stage/alternance)', () => {
    const offer = { ...base, title: 'Développeur Senior CDI', description: 'Poste CDI' };
    const result = mapAdzunaToOffer(offer, SOURCE_ID);
    expect(result).toBeNull();
  });

  it('converts annual salary to monthly', () => {
    const result = mapAdzunaToOffer(base, SOURCE_ID);
    expect(result!.salaryMinMonthly).toBe(600);
    expect(result!.salaryMaxMonthly).toBe(1200);
  });

  it('ignores predicted salary', () => {
    const offer = { ...base, salary_is_predicted: '1' };
    const result = mapAdzunaToOffer(offer, SOURCE_ID);
    expect(result!.salaryMinMonthly).toBeNull();
    expect(result!.salaryMaxMonthly).toBeNull();
  });

  it('uses last area as locationCity', () => {
    const result = mapAdzunaToOffer(base, SOURCE_ID);
    expect(result!.locationCity).toBe('Paris');
  });

  it('returns null when id or title missing', () => {
    expect(mapAdzunaToOffer({ ...base, id: '' } as AdzunaOfferRaw, SOURCE_ID)).toBeNull();
    const noTitle = { ...base, title: undefined } as AdzunaOfferRaw;
    expect(mapAdzunaToOffer(noTitle, SOURCE_ID)).toBeNull();
  });
});
