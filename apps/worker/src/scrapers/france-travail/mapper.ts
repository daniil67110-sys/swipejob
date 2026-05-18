import type { NewOffer } from '@swipejob/db/schema';
import type { FranceTravailOfferRaw } from './client.js';

/**
 * France Travail typeContrat codes (référentiel partenaire) :
 * - E2 : apprentissage / alternance
 * - MIS : stage (rémunéré)
 * - FS  : stage non-rémunéré
 * - Autres codes (CDI/CDD/...) ignorés V1.
 */
function mapContractType(code: string | undefined): 'stage' | 'alternance' | null {
  if (!code) return null;
  if (code === 'E2') return 'alternance';
  if (code === 'MIS' || code === 'FS') return 'stage';
  return null;
}

/**
 * Parse une chaîne libre comme "Salaire : 600 à 1 200 € / mois" → { min, max }.
 * Best-effort : si on ne parse pas, on retourne null/null.
 */
function parseSalaryLibelle(libelle: string | undefined): {
  min: number | null;
  max: number | null;
} {
  if (!libelle) return { min: null, max: null };
  // Capture les nombres avec espaces ou non, ignore les centimes.
  const numbers = libelle
    .replace(/[^\d\s]/g, ' ')
    .split(/\s+/)
    .map((s) => parseInt(s.replace(/\s/g, ''), 10))
    .filter((n) => Number.isFinite(n) && n >= 200 && n <= 100_000);
  if (numbers.length === 0) return { min: null, max: null };
  if (numbers.length === 1) return { min: numbers[0]!, max: null };
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return { min, max };
}

/**
 * Convertit une offre brute France Travail en row `offers` SwipeJob.
 * `sourceId` doit être fourni (résolu par le job orchestrateur).
 *
 * V1 : remoteMode laissé null (pas exposé directement par l'API France Travail —
 * Story 2.4 normalisation pourra l'inférer depuis description/lieu).
 */
export function mapFranceTravailToOffer(
  raw: FranceTravailOfferRaw,
  sourceId: string,
): NewOffer | null {
  const contractType = mapContractType(raw.typeContrat);
  if (!contractType) return null; // Skip CDI/CDD etc.
  if (!raw.id || !raw.intitule) return null;

  const salary = parseSalaryLibelle(raw.salaire?.libelle);

  return {
    sourceId,
    externalId: raw.id,
    title: raw.intitule,
    description: raw.description ?? null,
    companyName: raw.entreprise?.nom ?? null,
    companyLogoUrl: raw.entreprise?.logo ?? null,
    contractType,
    locationCity: raw.lieuTravail?.commune ?? raw.lieuTravail?.libelle ?? null,
    locationLat: typeof raw.lieuTravail?.latitude === 'number' ? raw.lieuTravail.latitude : null,
    locationLng: typeof raw.lieuTravail?.longitude === 'number' ? raw.lieuTravail.longitude : null,
    remoteMode: null,
    salaryMinMonthly: salary.min,
    salaryMaxMonthly: salary.max,
    startDate: null,
    duration: raw.dureeTravailLibelle ?? null,
    requirements: {
      skills: raw.competences?.map((c) => c.libelle).filter(Boolean) ?? [],
      educationLevels:
        raw.formations?.map((f) => f.niveauLibelle).filter((s): s is string => Boolean(s)) ?? [],
      languages: raw.langues?.map((l) => l.libelle).filter(Boolean) ?? [],
    },
    embedding: null,
    rawPayload: raw as unknown as Record<string, unknown>,
    expiresAt: null,
    isActive: true,
  };
}
