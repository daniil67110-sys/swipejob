import { createId as createCuid2 } from '@paralleldrive/cuid2';

/**
 * Generates a cuid2 ID (24 chars, alphanumeric, lowercase).
 * Convention NFR-Se architecture.md ligne 562 — jamais d'auto-increment énumérable.
 */
export function createId(): string {
  return createCuid2();
}
