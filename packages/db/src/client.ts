/**
 * SwipeJob — Drizzle ORM client stub
 * Sera implémenté en Story 1.2 (TECH-002 — Setup Neon Postgres + Drizzle)
 *
 * Utilise un Proxy pour détecter les accès au runtime et lever une erreur explicite
 * au lieu de crasher avec "Cannot read property of null".
 */
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Type stub — sera remplacé par le vrai schéma en Story 1.2
type Schema = Record<string, never>;

export const db: PostgresJsDatabase<Schema> = new Proxy({} as PostgresJsDatabase<Schema>, {
  get(_target, prop) {
    throw new Error(
      `@swipejob/db: client not initialized — property "${String(prop)}" accessed before Story 1.2 implements the real Drizzle client. Implement in Story 1.2.`,
    );
  },
});

export type DrizzleClient = typeof db;
