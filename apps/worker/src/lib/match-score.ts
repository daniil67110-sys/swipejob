/**
 * Story 2.8 — composite matching score (60% cosine skills + 25% prefs + 15% education).
 * Stories 2.9 fairness + 2.11 explanation co-localisées dans le même fichier.
 *
 * FAIRNESS WHITELIST (Story 2.9 NFR-F1) :
 * Seules les features ci-dessous sont autorisées dans le scoring. Toute review
 * doit vérifier que computeMatchScore n'utilise PAS : age/sexe/genre/origine/
 * nationalité/situation familiale/santé/religion/orientation/etc.
 */
export const ALLOWED_FEATURES = [
  'cosine_skills',
  'pref_contract_type',
  'pref_city',
  'pref_work_mode',
  'pref_salary',
  'education_level',
] as const;

export type AllowedFeature = (typeof ALLOWED_FEATURES)[number];

export type UserPrefsForMatch = {
  contractTypes: string[];
  cities: string[];
  workModes: string[];
  salaryMinMonthly: number | null;
  salaryMaxMonthly: number | null;
};

export type OfferForMatch = {
  id: string;
  contractType: string | null;
  locationCity: string | null;
  remoteMode: string | null;
  salaryMinMonthly: number | null;
  salaryMaxMonthly: number | null;
};

export type UserEducationLevel = string | null;

/**
 * Pref fit 0-1. Pondération interne :
 *  - contract type match : 0.4
 *  - city match (case insensitive) : 0.3
 *  - work mode match : 0.15
 *  - salary range overlap : 0.15
 * Un user sans prefs (toutes vides) → 0.5 (neutre, on ne pénalise pas).
 */
export function computePrefFit(prefs: UserPrefsForMatch, offer: OfferForMatch): number {
  let score = 0;
  let parts = 0;
  if (prefs.contractTypes.length > 0) {
    parts += 0.4;
    if (offer.contractType && prefs.contractTypes.includes(offer.contractType)) score += 0.4;
  }
  if (prefs.cities.length > 0) {
    parts += 0.3;
    if (offer.locationCity) {
      const offerCityLower = offer.locationCity.toLowerCase();
      if (prefs.cities.some((c) => c.toLowerCase() === offerCityLower)) {
        score += 0.3;
      }
    }
  }
  if (prefs.workModes.length > 0) {
    parts += 0.15;
    if (offer.remoteMode && prefs.workModes.includes(offer.remoteMode)) score += 0.15;
  }
  if (prefs.salaryMinMonthly !== null || prefs.salaryMaxMonthly !== null) {
    parts += 0.15;
    const userMin = prefs.salaryMinMonthly ?? 0;
    const userMax = prefs.salaryMaxMonthly ?? Number.POSITIVE_INFINITY;
    const offerMin = offer.salaryMinMonthly ?? 0;
    const offerMax = offer.salaryMaxMonthly ?? Number.POSITIVE_INFINITY;
    // Overlap si max(offerMin, userMin) <= min(offerMax, userMax).
    if (Math.max(offerMin, userMin) <= Math.min(offerMax, userMax)) {
      score += 0.15;
    }
  }
  if (parts === 0) return 0.5; // user sans prefs → neutre
  return score / parts;
}

/**
 * Education fit 0-1. V1 simple : 1 si user.level appartient à offer.requirements.educationLevels,
 * sinon 0.5 (offre ne précise pas) ou 0 (mismatch explicite).
 */
export function computeEducationFit(
  userLevel: UserEducationLevel,
  offerEducationLevels: string[] | null | undefined,
): number {
  if (!userLevel) return 0.5;
  if (!offerEducationLevels || offerEducationLevels.length === 0) return 0.5; // offre ne précise pas
  const lower = userLevel.toLowerCase();
  const found = offerEducationLevels.some((e) => e.toLowerCase().includes(lower));
  return found ? 1 : 0;
}

/**
 * Composite score 0-100. Weights :
 *  - cosineSimilarity skills 60%
 *  - prefFit 25%
 *  - educationFit 15%
 *
 * cosineSimilarity attendu 0-1 (déjà normalisé pgvector ou cosine JS).
 */
export function compositeScore(cosineSim: number, prefFit: number, eduFit: number): number {
  const raw = 0.6 * cosineSim + 0.25 * prefFit + 0.15 * eduFit;
  return Math.round(Math.max(0, Math.min(1, raw)) * 100);
}

export type ExplanationFeature = {
  factor: AllowedFeature;
  weight: number;
  value: number; // 0-1
  label: string; // FR clair
  matched: boolean;
};

/**
 * Story 2.11 — explanation textuelle. Retourne 3-5 features avec poids et match status.
 */
export function buildExplanation(input: {
  cosineSim: number;
  prefs: UserPrefsForMatch;
  offer: OfferForMatch;
  userEducationLevel: UserEducationLevel;
  offerEducationLevels: string[] | null | undefined;
}): ExplanationFeature[] {
  const features: ExplanationFeature[] = [];

  features.push({
    factor: 'cosine_skills',
    weight: 0.6,
    value: input.cosineSim,
    label: 'Compétences techniques',
    matched: input.cosineSim >= 0.6,
  });

  if (input.prefs.contractTypes.length > 0) {
    const matched = Boolean(
      input.offer.contractType && input.prefs.contractTypes.includes(input.offer.contractType),
    );
    features.push({
      factor: 'pref_contract_type',
      weight: 0.1,
      value: matched ? 1 : 0,
      label: 'Type de contrat',
      matched,
    });
  }

  if (input.prefs.cities.length > 0) {
    const matched = Boolean(
      input.offer.locationCity &&
      input.prefs.cities.some((c) => c.toLowerCase() === input.offer.locationCity!.toLowerCase()),
    );
    features.push({
      factor: 'pref_city',
      weight: 0.075,
      value: matched ? 1 : 0,
      label: 'Localisation',
      matched,
    });
  }

  const eduFit = computeEducationFit(input.userEducationLevel, input.offerEducationLevels);
  features.push({
    factor: 'education_level',
    weight: 0.15,
    value: eduFit,
    label: "Niveau d'études",
    matched: eduFit >= 0.5,
  });

  return features.slice(0, 5);
}
