/**
 * Story 8.1 — Bootstrap d'un compte ADMIN.
 *
 * Usage : `pnpm db:grant-admin <email>`
 *
 * Contrairement à `dev.ts`, ce script s'exécute aussi en production (utile pour
 * bootstrapper le premier admin une fois Oksana inscrite via Google OAuth).
 * Sécurités :
 * - Refuse si l'email n'existe pas en base (pas de création silencieuse).
 * - Idempotent : ré-exécutions sans effet si le rôle est déjà ADMIN.
 * - Log explicite avant et après l'UPDATE.
 *
 * Pour révoquer un admin, modifier la valeur de `--role` :
 *   `pnpm db:grant-admin <email> --role USER`
 */
/* eslint-disable no-console -- CLI script */
// Note : le chargement de .env.local/.env est délégué à Node via les flags
// --env-file-if-exists déclarés dans packages/db/package.json (script
// db:grant-admin). Cette approche évite le piège des imports ES hoistés
// (loadEnv() serait appelé APRÈS l'évaluation de ../lib/env.js).
import { eq } from 'drizzle-orm';
import { closeDb, db } from '../client.js';
import { isDatabaseConfigured } from '../lib/env.js';
import { users } from '../schema/index.js';

type Role = 'ADMIN' | 'USER';

function parseArgs(): { email: string; role: Role } {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.error('Usage: pnpm db:grant-admin <email> [--role ADMIN|USER]');
    process.exit(1);
  }
  const email = args[0]?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error(`[grant-admin] Invalid email: "${args[0]}"`);
    process.exit(1);
  }
  let role: Role = 'ADMIN';
  const roleIdx = args.indexOf('--role');
  if (roleIdx !== -1) {
    const next = args[roleIdx + 1];
    if (next === 'ADMIN' || next === 'USER') {
      role = next;
    } else {
      console.error(`[grant-admin] --role must be ADMIN or USER (got "${next}")`);
      process.exit(1);
    }
  }
  return { email, role };
}

async function main() {
  if (!isDatabaseConfigured) {
    console.error('[grant-admin] DATABASE_URL is not set.');
    process.exit(1);
  }

  const { email, role } = parseArgs();

  const found = await db
    .select({ id: users.id, email: users.email, role: users.role, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const row = found[0];
  if (!row) {
    console.error(
      `[grant-admin] No user found for email "${email}". ` +
        "L'utilisateur doit d'abord créer son compte via Google OAuth.",
    );
    await closeDb();
    process.exit(1);
  }

  if (row.deletedAt) {
    console.error(
      `[grant-admin] User "${email}" est soft-deleted (deletedAt=${row.deletedAt.toISOString()}). ` +
        'Annulation pour éviter de réactiver un compte supprimé.',
    );
    await closeDb();
    process.exit(1);
  }

  if (row.role === role) {
    console.log(`[grant-admin] No-op : user "${email}" est déjà ${role}.`);
    await closeDb();
    return;
  }

  await db.update(users).set({ role }).where(eq(users.id, row.id));
  console.log(`[grant-admin] ✓ user "${email}" : role ${row.role} → ${role}`);
  await closeDb();
}

main().catch(async (err) => {
  console.error('[grant-admin] Failed:', err);
  await closeDb();
  process.exit(1);
});
