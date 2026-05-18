import { defineConfig } from 'drizzle-kit';

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
  ],
  out: './src/migrations',
  dialect: 'postgresql',
  casing: 'snake_case',
  verbose: true,
  strict: true,
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
