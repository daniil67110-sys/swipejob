import type { NewOffer } from '@swipejob/db/schema';
import type { AdzunaOfferRaw } from './client.js';

/**
 * Inférence stage/alternance par regex sur title + description.
 * Adzuna ne fournit pas ce flag explicitement (contract_type = full/part time
 * et contract_type = contract/permanent, pas stage/alternance dédié).
 *
 * Best-effort V1. La normalisation Story 2.4 pourra raffiner.
 */
function inferContractType(
  title: string,
  description: string | undefined,
): 'stage' | 'alternance' | null {
  const haystack = `${title} ${description ?? ''}`.toLowerCase();
  if (/altern|apprent/i.test(haystack)) return 'alternance';
  if (/\bstage\b|stagiaire/i.test(haystack)) return 'stage';
  return null;
}

/**
 * Adzuna `salary_min/max` sont en EUR ANNUEL. On les convertit en mensuel
 * (÷12) pour aligner avec le schéma SwipeJob `offers.salary_*_monthly`.
 *
 * Si salary_is_predicted = '1' (prédit par Adzuna, pas le recruteur),
 * on ignore — V1 préfère pas de salaire à un salaire deviné.
 */
function mapSalary(raw: AdzunaOfferRaw): { min: number | null; max: number | null } {
  if (raw.salary_is_predicted === '1') return { min: null, max: null };
  const min = typeof raw.salary_min === 'number' ? Math.round(raw.salary_min / 12) : null;
  const max = typeof raw.salary_max === 'number' ? Math.round(raw.salary_max / 12) : null;
  // Sanity check : stage 0-3000€/mois, alternance 600-2500€/mois. Si > 50k/mois, c'est suspect.
  if ((min !== null && min > 50_000) || (max !== null && max > 50_000)) {
    return { min: null, max: null };
  }
  return { min, max };
}

export function mapAdzunaToOffer(raw: AdzunaOfferRaw, sourceId: string): NewOffer | null {
  if (!raw.id || !raw.title) return null;
  const contractType = inferContractType(raw.title, raw.description);
  if (!contractType) return null; // skip CDI/CDD V1

  const salary = mapSalary(raw);

  return {
    sourceId,
    externalId: String(raw.id),
    title: raw.title,
    description: raw.description ?? null,
    companyName: raw.company?.display_name ?? null,
    companyLogoUrl: null,
    contractType,
    // location.area est un array hiérarchique : [country, region, dept, city]
    locationCity:
      raw.location?.area?.[raw.location.area.length - 1] ?? raw.location?.display_name ?? null,
    locationLat: typeof raw.latitude === 'number' ? raw.latitude : null,
    locationLng: typeof raw.longitude === 'number' ? raw.longitude : null,
    remoteMode: null,
    salaryMinMonthly: salary.min,
    salaryMaxMonthly: salary.max,
    startDate: null,
    duration: null,
    requirements: { skills: [], educationLevels: [], languages: [] },
    embedding: null,
    rawPayload: raw as unknown as Record<string, unknown>,
    expiresAt: null,
    isActive: true,
  };
}
