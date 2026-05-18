/**
 * Dedupe utilities (Story 2.5).
 *
 * Jaro-Winkler similarity implémentée maison (~30 lignes, pas de dep externe).
 * Composite similarity pondère titre + companyName + city, avec contractType
 * binaire (différence → score 0 directement, pas de match cross-type possible).
 */

/**
 * Normalise une string pour fuzzy match : lowercase + no accent + no ponctuation +
 * collapse whitespace.
 */
export function normalizeForFuzzy(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Jaro distance entre 2 strings. O(n*m).
 * Source : algo de référence Winkler 1990.
 */
function jaroDistance(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matchDistance = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches: boolean[] = new Array(a.length).fill(false);
  const bMatches: boolean[] = new Array(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
}

/**
 * Jaro-Winkler similarity 0-1. Bonus pour prefixes communs jusqu'à 4 chars.
 * Score > 0.9 = quasi-identique, > 0.85 = très probable même offre.
 */
export function jaroWinklerSimilarity(a: string, b: string): number {
  const aN = normalizeForFuzzy(a);
  const bN = normalizeForFuzzy(b);
  const jaro = jaroDistance(aN, bN);
  if (jaro < 0.7) return jaro;
  let prefix = 0;
  const maxPrefix = Math.min(4, aN.length, bN.length);
  for (let i = 0; i < maxPrefix; i++) {
    if (aN[i] === bN[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

export type OfferForDedupe = {
  id: string;
  title: string;
  companyName: string | null;
  locationCity: string | null;
  contractType: string | null;
};

/**
 * Composite similarity 2 offres : pondération titre 0.4 + company 0.3 + city 0.2 +
 * contractType 0.1 (binary). Si contractType diffère ET non-null des deux côtés → 0.
 */
export function compositeSimilarity(a: OfferForDedupe, b: OfferForDedupe): number {
  // Hard filter : type de contrat différent → impossible que ce soit la même offre.
  if (a.contractType && b.contractType && a.contractType !== b.contractType) {
    return 0;
  }

  const titleSim = jaroWinklerSimilarity(a.title, b.title);
  const companySim =
    a.companyName && b.companyName ? jaroWinklerSimilarity(a.companyName, b.companyName) : 0;
  const citySim =
    a.locationCity && b.locationCity ? jaroWinklerSimilarity(a.locationCity, b.locationCity) : 0;
  const typeSim = a.contractType && b.contractType && a.contractType === b.contractType ? 1 : 0;

  return titleSim * 0.4 + companySim * 0.3 + citySim * 0.2 + typeSim * 0.1;
}
