import { env, isAdzunaConfigured } from '../../lib/env.js';
import logger from '../../lib/logger.js';

/**
 * Adzuna API v1 — Job Search.
 * Doc : https://developer.adzuna.com/docs/search
 *
 * Auth via query string (app_id + app_key). Pas d'OAuth.
 * Pagination par page number (1-indexed), max 50 résultats/page.
 */

export type AdzunaOfferRaw = {
  id: string;
  title?: string;
  description?: string;
  created?: string;
  company?: { display_name?: string };
  category?: { tag?: string; label?: string };
  location?: { area?: string[]; display_name?: string };
  latitude?: number;
  longitude?: number;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  contract_time?: string;
  contract_type?: string;
  redirect_url?: string;
};

export type FetchAdzunaParams = {
  /** Page number (1-indexed). Adzuna max ~50 pages free tier. */
  page?: number;
  /** Mots-clés (full-text). V1 : on cherche stage/alternance/apprenti */
  what?: string;
  /** Lieu (city/region). Vide = France entière. */
  where?: string;
  /** Catégorie Adzuna : 'graduate-trainee-jobs', 'other-general-jobs', etc. */
  category?: string;
  /** 1-50. Default 50 (max). */
  resultsPerPage?: number;
};

export type FetchAdzunaResult = {
  offers: AdzunaOfferRaw[];
  count: number;
  meanSalary?: number;
};

const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 30_000;

export async function fetchAdzunaOffers(
  params: FetchAdzunaParams = {},
): Promise<FetchAdzunaResult> {
  if (!isAdzunaConfigured || !env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
    throw new Error('Adzuna not configured (ADZUNA_APP_ID/KEY missing)');
  }
  const page = params.page ?? 1;
  const qs = new URLSearchParams({
    app_id: env.ADZUNA_APP_ID,
    app_key: env.ADZUNA_APP_KEY,
    results_per_page: String(params.resultsPerPage ?? 50),
    'content-type': 'application/json',
  });
  if (params.what) qs.set('what', params.what);
  if (params.where) qs.set('where', params.where);
  if (params.category) qs.set('category', params.category);

  const url = `${env.ADZUNA_BASE_URL}/search/${page}?${qs.toString()}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn({ attempt, delay }, 'Adzuna rate limited');
        await sleep(delay);
        continue;
      }
      if (res.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn({ attempt, delay, status: res.status }, 'Adzuna server error');
        await sleep(delay);
        continue;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Adzuna API error ${res.status}: ${txt.slice(0, 200)}`);
      }

      const json = (await res.json()) as {
        results?: AdzunaOfferRaw[];
        count?: number;
        mean?: number;
      };
      return {
        offers: json.results ?? [],
        count: json.count ?? 0,
        meanSalary: json.mean,
      };
    } catch (err) {
      clearTimeout(timeout);
      if (attempt === MAX_RETRIES - 1) {
        throw err;
      }
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn({ attempt, delay, err }, 'Adzuna fetch failed — retrying');
      await sleep(delay);
    }
  }
  throw new Error('Adzuna fetch exhausted retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
