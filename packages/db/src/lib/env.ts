import { z } from 'zod';

const isProduction = process.env['NODE_ENV'] === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().optional(),
});

export type DbEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  if (isProduction) {
    console.error('[db/env] Invalid environment variables', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid DB environment variables — aborting boot');
  }
  console.warn(
    '[db/env] Some environment variables are invalid (dev fallback applied):',
    parsed.error.flatten().fieldErrors,
  );
  // F-007 : avertissement explicite si DATABASE_URL est fournie mais invalide,
  // pour éviter le silent fallback vers le Proxy stub.
  if (process.env['DATABASE_URL']) {
    console.warn(
      '[db/env] DATABASE_URL is set but invalid — treating as unconfigured. DB calls will throw at runtime.',
    );
  }
}

export const env: DbEnv = parsed.success ? parsed.data : (envSchema.parse({}) as DbEnv);

export const isDatabaseConfigured = Boolean(env.DATABASE_URL);

if (isProduction && !isDatabaseConfigured) {
  throw new Error('DATABASE_URL is required in production');
}
