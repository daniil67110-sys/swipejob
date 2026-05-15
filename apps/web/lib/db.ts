/**
 * Database client stub
 * Sera implémenté en Story 1.2 (TECH-002 — Drizzle + Neon Postgres)
 */

// TODO: Story 1.2 — importer @swipejob/db et exposer le client Drizzle
// import { db } from '@swipejob/db';
// export { db };

export const DB_CONFIG = {
  provider: 'neon' as const,
  region: 'eu-west-1',
};
