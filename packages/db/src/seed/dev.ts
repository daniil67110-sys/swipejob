/**
 * Seed dev — 1 admin + 2 utilisateurs test + leur profile.
 * Idempotent (UPSERT). Throw si NODE_ENV === 'production'.
 *
 * Usage : `pnpm db:seed`
 */
/* eslint-disable no-console -- CLI script, console is the natural output channel */
import { closeDb, db } from '../client.js';
import { env, isDatabaseConfigured } from '../lib/env.js';
import { profiles, users } from '../schema/index.js';

if (env.NODE_ENV === 'production') {
  console.error('[seed] Refusing to seed in production. Aborting.');
  process.exit(1);
}

if (!isDatabaseConfigured) {
  console.error('[seed] DATABASE_URL is not set. Set it in .env.local and retry.');
  process.exit(1);
}

const seedUsers = [
  {
    email: 'admin@swipejob.local',
    name: 'Admin SwipeJob',
    role: 'ADMIN' as const,
    source: 'EMAIL' as const,
    consentStatus: 'GRANTED' as const,
    profile: { firstName: 'Admin', lastName: 'SwipeJob', city: 'Paris' },
  },
  {
    email: 'alice@test.local',
    name: 'Alice Test',
    role: 'USER' as const,
    source: 'GOOGLE' as const,
    consentStatus: 'GRANTED' as const,
    profile: { firstName: 'Alice', lastName: 'Test', city: 'Lyon' },
  },
  {
    email: 'bob@test.local',
    name: 'Bob Test',
    role: 'USER' as const,
    source: 'EMAIL' as const,
    consentStatus: 'PENDING' as const,
    profile: { firstName: 'Bob', lastName: 'Test', city: 'Toulouse' },
  },
];

async function main(): Promise<void> {
  console.log('[seed] Starting dev seed…');

  // F-005 : transaction par user pour garantir l'atomicité user + profile.
  for (const u of seedUsers) {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(users)
        .values({
          email: u.email,
          name: u.name,
          role: u.role,
          source: u.source,
          consentStatus: u.consentStatus,
          emailVerified: new Date(),
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: u.name,
            role: u.role,
            source: u.source,
            consentStatus: u.consentStatus,
          },
        })
        .returning({ id: users.id, email: users.email });

      if (!inserted) {
        console.warn(`[seed] Failed to upsert ${u.email}`);
        return;
      }

      await tx
        .insert(profiles)
        .values({
          userId: inserted.id,
          firstName: u.profile.firstName,
          lastName: u.profile.lastName,
          city: u.profile.city,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            firstName: u.profile.firstName,
            lastName: u.profile.lastName,
            city: u.profile.city,
          },
        });

      console.log(`[seed] ✓ upserted ${u.email} (id=${inserted.id})`);
    });
  }

  console.log('[seed] Done.');
  await closeDb();
}

main().catch(async (err) => {
  console.error('[seed] Failed:', err);
  await closeDb();
  process.exit(1);
});
