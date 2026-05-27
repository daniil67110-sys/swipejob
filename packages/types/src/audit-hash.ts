/**
 * Audit log PII hashing — SERVER-ONLY.
 * Story 6.5 — IP et User-Agent doivent être hashés avant insert dans audit_logs.
 *
 * Imports `node:crypto`, ne pas consommer depuis un bundle client/edge browser.
 */
import { createHmac } from 'node:crypto';

const FALLBACK_SECRET = 'dev-unsafe-audit-secret-do-not-use-in-production';

/**
 * Retourne un HMAC SHA-256 (16 hex chars) de la valeur, ou `null` si entrée vide.
 *
 * Le hash est :
 * - **Stable** : même input → même output (permet de corréler events depuis la même IP).
 * - **Irréversible** : impossible de remonter à l'IP/UA en clair (conformité CNIL).
 * - **Tronqué à 16 chars** : suffisant pour entropy (>10^19), évite des hashes trop verbeux.
 *
 * `secret` doit être ≥32 chars en production (validation côté env du caller).
 */
export function hashAuditValue(value: string | null | undefined, secret: string): string | null {
  if (!value) return null;
  return createHmac('sha256', secret || FALLBACK_SECRET)
    .update(value)
    .digest('hex')
    .slice(0, 16);
}
