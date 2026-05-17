/**
 * PII helpers — SERVER-ONLY.
 * Imports `node:crypto`, ne pas consommer depuis un bundle client/edge browser.
 * Pour les Server Components / Route Handlers / worker uniquement.
 */
import { createHmac } from 'node:crypto';

const FALLBACK_SECRET = 'dev-unsafe-pii-secret-do-not-use-in-production';

function getSecret(): string {
  const secret = process.env['PII_EMAIL_HASH_SECRET'];
  if (secret && secret.length >= 16) return secret;
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('PII_EMAIL_HASH_SECRET must be set (≥16 chars) in production');
  }
  return FALLBACK_SECRET;
}

export const PII_KEYS = new Set([
  'email',
  'password',
  'cvtext',
  'firstname',
  'lastname',
  'phone',
  'address',
]);

export function hashEmail(email: string): string {
  return createHmac('sha256', getSecret()).update(email.toLowerCase()).digest('hex').slice(0, 16);
}

export function redactPII<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input.map((item) => redactPII(item)) as unknown as T;
  }
  if (typeof input !== 'object') return input;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (PII_KEYS.has(lowerKey)) {
      if (lowerKey === 'email' && typeof value === 'string') {
        out[key] = `sha256:${hashEmail(value)}`;
      } else {
        out[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      out[key] = redactPII(value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}
