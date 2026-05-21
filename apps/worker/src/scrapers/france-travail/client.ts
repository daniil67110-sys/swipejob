import { env } from '../../lib/env.js';
import logger from '../../lib/logger.js';
import { getFranceTravailToken } from './auth.js';

export type FranceTravailOfferRaw = {
  id: string;
  intitule?: string;
  description?: string;
  dateCreation?: string;
  dateActualisation?: string;
  entreprise?: { nom?: string; logo?: string; description?: string };
  typeContrat?: string;
  typeContratLibelle?: string;
  natureContrat?: string;
  experienceLibelle?: string;
  lieuTravail?: {
    libelle?: string;
    latitude?: number;
    longitude?: number;
    codePostal?: string;
    commune?: string;
  };
  salaire?: { libelle?: string; commentaire?: string };
  dureeTravailLibelle?: string;
  competences?: Array<{ libelle: string }>;
  formations?: Array<{ niveauLibelle?: string }>;
  langues?: Array<{ libelle: string }>;
  origineOffre?: { origine?: string; urlOrigine?: string };
};

export type FetchOffersParams = {
  /** Nature contrat France Travail : E2=apprentissage, FS=professionnalisation. */
  natureContrat?: 'E2' | 'FS';
  /** Offres publiées depuis N jours (FT n'accepte que 1, 3, 7, 14 ou 31). */
  publieeDepuisDays?: 1 | 3 | 7 | 14 | 31;
  /** Pagination : index début (inclus) */
  rangeStart?: number;
  /** Pagination : index fin (inclus). Max 149 (limite API). */
  rangeEnd?: number;
};

export type FetchOffersResult = {
  offers: FranceTravailOfferRaw[];
  /** True si une page suivante existe (Content-Range indique > rangeEnd) */
  hasMore: boolean;
  /** Index disponible le plus haut selon l'API */
  totalCount: number;
};

const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Fetch une page d'offres depuis l'API France Travail v2.
 *
 * Gère :
 * - Auth OAuth2 (token cached)
 * - 429 rate limit → backoff exponentiel (1s, 2s, 4s)
 * - 5xx server → backoff exponentiel
 * - Pagination via Content-Range header
 */
export async function fetchFranceTravailOffers(
  params: FetchOffersParams = {},
): Promise<FetchOffersResult> {
  const token = await getFranceTravailToken();
  if (!token) {
    throw new Error('France Travail not configured (FRANCE_TRAVAIL_CLIENT_ID/SECRET missing)');
  }

  const rangeStart = params.rangeStart ?? 0;
  const rangeEnd = Math.min(params.rangeEnd ?? rangeStart + 149, rangeStart + 149);

  const qs = new URLSearchParams({
    range: `${rangeStart}-${rangeEnd}`,
  });
  if (params.natureContrat) qs.set('natureContrat', params.natureContrat);
  if (params.publieeDepuisDays) qs.set('publieeDepuis', String(params.publieeDepuisDays));

  const url = `${env.FRANCE_TRAVAIL_BASE_URL}/offres/search?${qs.toString()}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn({ attempt, delay, status: 429 }, 'France Travail rate limited');
        await sleep(delay);
        continue;
      }
      if (res.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn({ attempt, delay, status: res.status }, 'France Travail server error');
        await sleep(delay);
        continue;
      }
      if (!res.ok && res.status !== 206) {
        // 206 Partial Content est succès pour paginated GET
        const txt = await res.text().catch(() => '');
        throw new Error(`France Travail API error ${res.status}: ${txt.slice(0, 200)}`);
      }

      const contentRange = res.headers.get('content-range') ?? '';
      const totalCount = parseInt(contentRange.split('/')[1] ?? '0', 10) || 0;
      const json = (await res.json()) as { resultats?: FranceTravailOfferRaw[] };
      const offers = json.resultats ?? [];
      const hasMore = rangeEnd + 1 < totalCount;
      return { offers, hasMore, totalCount };
    } catch (err) {
      clearTimeout(timeout);
      if (attempt === MAX_RETRIES - 1) {
        throw err;
      }
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn({ attempt, delay, err }, 'France Travail fetch failed — retrying');
      await sleep(delay);
    }
  }
  throw new Error('France Travail fetch exhausted retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
