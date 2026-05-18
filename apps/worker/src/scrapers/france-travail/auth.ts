import { env, isFranceTravailConfigured } from '../../lib/env.js';
import logger from '../../lib/logger.js';

type TokenCache = {
  accessToken: string;
  expiresAt: number; // epoch ms
};

let cache: TokenCache | null = null;

/**
 * OAuth2 client_credentials flow pour API France Travail.
 *
 * Token court (~1500s) → cache in-memory avec marge de sécurité 60s.
 * Pas de stockage DB : un worker qui redémarre re-fetch un token.
 *
 * Endpoint d'auth : entreprise.francetravail.fr (pas api.francetravail.io —
 * spécificité historique de l'API).
 */
export async function getFranceTravailToken(): Promise<string | null> {
  if (
    !isFranceTravailConfigured ||
    !env.FRANCE_TRAVAIL_CLIENT_ID ||
    !env.FRANCE_TRAVAIL_CLIENT_SECRET
  ) {
    return null;
  }
  const now = Date.now();
  if (cache && cache.expiresAt > now + 60_000) {
    return cache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.FRANCE_TRAVAIL_CLIENT_ID,
    client_secret: env.FRANCE_TRAVAIL_CLIENT_SECRET,
    scope: env.FRANCE_TRAVAIL_SCOPE,
  });

  const url = `${env.FRANCE_TRAVAIL_AUTH_URL}?realm=%2Fpartenaire`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const errMsg = `France Travail auth failed: ${res.status} ${res.statusText}`;
    logger.error({ status: res.status }, errMsg);
    throw new Error(errMsg);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };
  cache = {
    accessToken: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return cache.accessToken;
}

export function clearFranceTravailTokenCache(): void {
  cache = null;
}
