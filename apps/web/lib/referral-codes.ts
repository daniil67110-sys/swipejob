import { randomBytes } from 'node:crypto';

/**
 * Story 5.3 — Helpers purs sur les codes de parrainage.
 *
 * Isolés du fichier principal (lib/referrals.ts) qui dépend de la DB / logger,
 * pour que ces helpers restent unit-testables sans setup vitest particulier.
 *
 * Alphabet sans caractères ambigus (O/0/I/1/L/U) pour la lecture vocale et la
 * copie manuelle. 6 chars → ~535M combinaisons.
 */
export const REF_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
export const REF_CODE_LENGTH = 6;

export function generateReferralCode(): string {
  const bytes = randomBytes(REF_CODE_LENGTH * 2);
  let out = '';
  for (let i = 0; i < bytes.length && out.length < REF_CODE_LENGTH; i++) {
    out += REF_CODE_ALPHABET[bytes[i]! % REF_CODE_ALPHABET.length];
  }
  return out;
}

export function sanitizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toUpperCase();
  if (normalized.length !== REF_CODE_LENGTH) return null;
  if (!/^[A-Z0-9]+$/.test(normalized)) return null;
  return normalized;
}
