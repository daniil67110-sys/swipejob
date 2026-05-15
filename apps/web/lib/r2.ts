import 'server-only';

/**
 * Cloudflare R2 client stub
 * Sera implémenté en Story 1.6 (TECH-006 — upload CV)
 *
 * server-only: empêche l'import depuis des Client Components
 */

function getR2BucketName(): string {
  const bucket = process.env['R2_BUCKET_NAME'];
  if (!bucket) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(
        "[r2] R2_BUCKET_NAME est obligatoire en production. Définissez la variable d'environnement.",
      );
    }
    // Fallback en développement uniquement
    return 'swipejob-dev';
  }
  return bucket;
}

export const R2_CONFIG = {
  provider: 'cloudflare-r2' as const,
  get bucket() {
    return getR2BucketName();
  },
};
