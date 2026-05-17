/**
 * SwipeJob — Drizzle ORM client.
 *
 * Mode conditionnel (Story 1.2.5 / TECH-002) :
 * - DATABASE_URL set → vrai client postgres-js + Drizzle.
 * - DATABASE_URL absent + NODE_ENV !== 'production' → Proxy qui throw au runtime
 *   (permet de booter web/worker en dev/CI sans Postgres local).
 * - DATABASE_URL absent + NODE_ENV === 'production' → throw au boot (via env.ts).
 *
 * HMR protection (F-002) : la connection est stockée sur globalThis en dev pour
 * éviter les leaks de pool sur les recharges Next.js (chaque module re-évalué
 * créerait un nouveau pool, saturant Neon Launch plan à 100 connexions).
 */
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env, isDatabaseConfigured } from './lib/env.js';
import { schema, type Schema } from './schema/index.js';

export type DrizzleClient = PostgresJsDatabase<Schema>;

type Connection = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  __drizzle_connection?: Connection;
  __drizzle_instance?: DrizzleClient;
};

const isServerless = Boolean(
  process.env['VERCEL'] === '1' || process.env['AWS_LAMBDA_FUNCTION_NAME'],
);

function initClient(): DrizzleClient {
  if (globalForDb.__drizzle_instance) return globalForDb.__drizzle_instance;
  if (!env.DATABASE_URL) {
    throw new Error(
      'initClient called without DATABASE_URL — should be guarded by isDatabaseConfigured.',
    );
  }
  const connection = postgres(env.DATABASE_URL, {
    // F-016 : pool serverless (Vercel) limité à 1 connexion ; worker long-running OK avec 10.
    max: isServerless ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  // F-004 : pas de `casing: 'snake_case'` runtime — dead code car tous nos schémas
  // ont des noms SQL explicites. Option garde son sens uniquement dans drizzle.config.ts.
  const instance = drizzle(connection, { schema });

  if (env.NODE_ENV !== 'production') {
    globalForDb.__drizzle_connection = connection;
    globalForDb.__drizzle_instance = instance;
  }
  return instance;
}

function makeStub(): DrizzleClient {
  return new Proxy({} as DrizzleClient, {
    get(_target, prop) {
      throw new Error(
        `@swipejob/db: client not initialized — property "${String(prop)}" accessed without DATABASE_URL set. ` +
          `Configure DATABASE_URL or use mocks for tests.`,
      );
    },
  });
}

export const db: DrizzleClient = isDatabaseConfigured ? initClient() : makeStub();

export async function closeDb(): Promise<void> {
  if (globalForDb.__drizzle_connection) {
    await globalForDb.__drizzle_connection.end({ timeout: 5 });
    delete globalForDb.__drizzle_connection;
    delete globalForDb.__drizzle_instance;
  }
}

// F-017 : `schema` exposé uniquement via `@swipejob/db/schema` (point d'entrée
// distinct dans package.json exports) — pas re-exporté ici pour éviter le double accès.
export type { Schema };
export { isDatabaseConfigured } from './lib/env.js';
