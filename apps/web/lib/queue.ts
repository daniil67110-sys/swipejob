import 'server-only';

/**
 * Queue client stub (BullMQ / Redis)
 * Sera implémenté en Story 1.2 (TECH-005)
 *
 * server-only: empêche l'import depuis des Client Components
 */

function getRedisUrl(): string {
  const url = process.env['REDIS_URL'];
  if (!url) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(
        "[queue] REDIS_URL est obligatoire en production. Définissez la variable d'environnement.",
      );
    }
    // Fallback en développement uniquement
    return 'redis://localhost:6379';
  }
  return url;
}

export const QUEUE_CONFIG = {
  provider: 'bullmq' as const,
  get redis() {
    return getRedisUrl();
  },
};
