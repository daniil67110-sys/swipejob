import type { NewOffer } from '@swipejob/db/schema';
import type { FranceTravailOfferRaw } from './client.js';

/**
 * France Travail natureContrat libellés (filtrage par code en API = E2/FS, mais
 * la réponse `/offres/search` renvoie le libellé, pas le code).
 * Codes :
 * - E2 → "Contrat apprentissage"
 * - FS → "Contrat de professionnalisation" (ou variantes)
 */
/**
 * FT renvoie `commune` = code INSEE ("75102") et `libelle` = "75 - Paris 2e
 * Arrondissement". On préfère le libelle lisible et on retire le préfixe
 * département. Fallback sur commune si libelle manque.
 */
function extractCity(
  lieuTravail: { libelle?: string; commune?: string } | undefined,
): string | null {
  if (!lieuTravail) return null;
  if (lieuTravail.libelle) {
    return lieuTravail.libelle.replace(/^[0-9]{2,3}\s*-\s*/, '').trim() || null;
  }
  return lieuTravail.commune ?? null;
}

function mapContractType(natureContrat: string | undefined): 'stage' | 'alternance' | null {
  if (!natureContrat) return null;
  const lc = natureContrat.toLowerCase();
  if (lc.includes('apprentissage') || lc.includes('professionnalisation')) return 'alternance';
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
  const contractType = mapContractType(raw.natureContrat);
  if (!contractType) return null; // Skip natures non-alternance.
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
    locationCity: extractCity(raw.lieuTravail),
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
    sourceUrl: raw.origineOffre?.urlOrigine ?? null,
    embedding: null,
    rawPayload: raw as unknown as Record<string, unknown>,
    expiresAt: null,
    isActive: true,
  };
}
