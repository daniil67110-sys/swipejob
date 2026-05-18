import type { Offer } from '@swipejob/db/schema';

/**
 * Heuristiques de normalisation des offres (Story 2.4).
 *
 * V1 : 100% local (regex + parsing JSON). V2 ajoutera Mistral fallback pour
 * compétences ambiguës + géocoding BAN/Nominatim pour les offres sans lat/lng.
 */

export type NormalizationResult = {
  qualityScore: number;
  sourceUrl: string | null;
  contactEmail: string | null;
  publishedAt: Date | null;
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Extrait un email de contact depuis le texte de description.
 * Retourne le premier match valide (RFC simpliste).
 * Best-effort — sans validation deliverability (V2).
 */
export function extractContactEmail(description: string | null | undefined): string | null {
  if (!description) return null;
  const match = description.match(EMAIL_REGEX);
  if (!match) return null;
  return match[0].toLowerCase();
}

/**
 * Construit l'URL source à partir du rawPayload + source name.
 * Adzuna : redirect_url direct dans le payload.
 * France Travail : pattern URL standard via id.
 */
export function extractSourceUrl(
  rawPayload: Record<string, unknown> | null,
  sourceName: string,
  externalId: string,
): string | null {
  if (sourceName === 'adzuna') {
    const url = rawPayload?.['redirect_url'];
    return typeof url === 'string' ? url : null;
  }
  if (sourceName === 'france-travail') {
    // Format de l'URL publique candidat (stable).
    return `https://candidat.francetravail.fr/offres/recherche/detail/${externalId}`;
  }
  return null;
}

/**
 * Extrait la date de publication depuis le rawPayload selon la source.
 * Retourne null si absent ou invalide.
 */
export function extractPublishedAt(
  rawPayload: Record<string, unknown> | null,
  sourceName: string,
): Date | null {
  if (!rawPayload) return null;
  let value: unknown = null;
  if (sourceName === 'adzuna') {
    value = rawPayload['created'];
  } else if (sourceName === 'france-travail') {
    value = rawPayload['dateCreation'] ?? rawPayload['dateActualisation'];
  }
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Quality score V1 : 0.0 à 1.0 basé sur présence champs critiques.
 * Title est mandatory (déjà 1 si présent, 0 sinon).
 * Threshold 0.6 = exclu du matching (cf. Story 2.4 AC).
 */
export function computeQualityScore(
  offer: Pick<
    Offer,
    | 'title'
    | 'description'
    | 'companyName'
    | 'locationCity'
    | 'locationLat'
    | 'locationLng'
    | 'salaryMinMonthly'
    | 'salaryMaxMonthly'
    | 'contractType'
    | 'publishedAt'
  >,
): number {
  if (!offer.title || offer.title.trim().length === 0) return 0;
  let score = 0.2; // base : title présent
  if (offer.description && offer.description.trim().length > 50) score += 0.2;
  if (offer.companyName) score += 0.15;
  if (offer.locationCity) score += 0.15;
  if (offer.locationLat !== null && offer.locationLng !== null) score += 0.1;
  if (offer.salaryMinMonthly !== null || offer.salaryMaxMonthly !== null) score += 0.1;
  if (offer.contractType === 'stage' || offer.contractType === 'alternance') score += 0.05;
  if (offer.publishedAt) score += 0.05;
  return Math.min(1, Math.round(score * 100) / 100);
}

/**
 * Calcule la normalisation complète pour une offre.
 * Le caller doit fournir le sourceName (resolu via JOIN offer_sources).
 */
export function normalizeOffer(
  offer: Pick<
    Offer,
    | 'title'
    | 'description'
    | 'companyName'
    | 'locationCity'
    | 'locationLat'
    | 'locationLng'
    | 'salaryMinMonthly'
    | 'salaryMaxMonthly'
    | 'contractType'
    | 'externalId'
    | 'rawPayload'
  >,
  sourceName: string,
  publishedAt: Date | null = null,
): NormalizationResult {
  const resolvedPublishedAt = publishedAt ?? extractPublishedAt(offer.rawPayload, sourceName);
  return {
    qualityScore: computeQualityScore({
      ...offer,
      publishedAt: resolvedPublishedAt,
    }),
    sourceUrl: extractSourceUrl(offer.rawPayload, sourceName, offer.externalId),
    contactEmail: extractContactEmail(offer.description),
    publishedAt: resolvedPublishedAt,
  };
}
