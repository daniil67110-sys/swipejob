import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Charge .env.local (priorité) puis .env depuis la racine du repo monorepo.
loadEnv({ path: '../../.env.local' });
loadEnv({ path: '../../.env' });

const databaseUrl = process.env['DATABASE_URL'];

export default defineConfig({
  // Exclut explicitement *.test.ts (Vitest est CJS, ne peut pas être require() par drizzle-kit).
  schema: [
    './src/schema/users.ts',
    './src/schema/accounts.ts',
    './src/schema/sessions.ts',
    './src/schema/verification-tokens.ts',
    './src/schema/profiles.ts',
    './src/schema/audit-logs.ts',
    './src/schema/ia-audit-logs.ts',
    './src/schema/parental-consents.ts',
    './src/schema/cvs.ts',
    './src/schema/preferences.ts',
    './src/schema/schools.ts',
    './src/schema/offer-sources.ts',
    './src/schema/offers.ts',
    './src/schema/match-scores.ts',
    './src/schema/swipe-events.ts',
    './src/schema/applications.ts',
    './src/schema/interview-preps.ts',
    './src/schema/push-subscriptions.ts',
    './src/schema/notification-events.ts',
    './src/schema/user-badges.ts',
    './src/schema/referrals.ts',
  ],
  out: './src/migrations',
  dialect: 'postgresql',
  casing: 'snake_case',
  verbose: true,
  strict: true,
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
