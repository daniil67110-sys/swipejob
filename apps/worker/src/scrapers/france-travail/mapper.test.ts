/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { mapFranceTravailToOffer } from './mapper.js';
import type { FranceTravailOfferRaw } from './client.js';

const SOURCE_ID = 'src_test_france_travail';

const baseOffer: FranceTravailOfferRaw = {
  id: 'FT-123',
  intitule: 'Stage Marketing',
  description: 'Stage de 6 mois en équipe marketing.',
  entreprise: { nom: 'Acme', logo: 'https://example.fr/logo.png' },
  typeContrat: 'MIS',
  lieuTravail: { libelle: 'Paris 75001', commune: 'Paris', latitude: 48.86, longitude: 2.35 },
  salaire: { libelle: 'Salaire : 600 à 1200 € / mois' },
  dureeTravailLibelle: '6 mois',
  competences: [{ libelle: 'Excel' }, { libelle: 'SQL' }],
};

describe('mapFranceTravailToOffer', () => {
  it('maps a stage offer correctly', () => {
    const result = mapFranceTravailToOffer(baseOffer, SOURCE_ID);
    expect(result).not.toBeNull();
    expect(result!.sourceId).toBe(SOURCE_ID);
    expect(result!.externalId).toBe('FT-123');
    expect(result!.contractType).toBe('stage');
    expect(result!.title).toBe('Stage Marketing');
    expect(result!.companyName).toBe('Acme');
    expect(result!.locationCity).toBe('Paris');
    expect(result!.locationLat).toBe(48.86);
    expect(result!.salaryMinMonthly).toBe(600);
    expect(result!.salaryMaxMonthly).toBe(1200);
    expect(result!.requirements?.skills).toEqual(['Excel', 'SQL']);
    expect(result!.rawPayload).toBeDefined();
  });

  it('maps an alternance (typeContrat=E2)', () => {
    const result = mapFranceTravailToOffer({ ...baseOffer, typeContrat: 'E2' }, SOURCE_ID);
    expect(result!.contractType).toBe('alternance');
  });

  it('returns null for CDI/CDD (out of scope V1)', () => {
    const result = mapFranceTravailToOffer({ ...baseOffer, typeContrat: 'CDI' }, SOURCE_ID);
    expect(result).toBeNull();
  });

  it('returns null when intitule missing', () => {
    const offer = { ...baseOffer };
    delete offer.intitule;
    const result = mapFranceTravailToOffer(offer, SOURCE_ID);
    expect(result).toBeNull();
  });

  it('handles missing salary gracefully', () => {
    const offer = { ...baseOffer };
    delete offer.salaire;
    const result = mapFranceTravailToOffer(offer, SOURCE_ID);
    expect(result!.salaryMinMonthly).toBeNull();
    expect(result!.salaryMaxMonthly).toBeNull();
  });

  it('parses single-value salary', () => {
    const offer = { ...baseOffer, salaire: { libelle: '900 € / mois' } };
    const result = mapFranceTravailToOffer(offer, SOURCE_ID);
    expect(result!.salaryMinMonthly).toBe(900);
    expect(result!.salaryMaxMonthly).toBeNull();
  });
});
