import { z } from 'zod';

const isProduction = process.env['NODE_ENV'] === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  RAILWAY_GIT_COMMIT_SHA: z.string().optional(),
  WORKER_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WORKER_ROLE: z.enum(['all', 'http-only', 'jobs-only']).default('all'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET_WORKER: z.string().default('swipejob-worker'),
  AXIOM_DATASET_AUDIT: z.string().default('swipejob-audit'),
  AUDIT_EXPORT_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  REDIS_URL: z.string().optional(),

  // France Travail API (Story 2.2)
  FRANCE_TRAVAIL_CLIENT_ID: z.string().optional(),
  FRANCE_TRAVAIL_CLIENT_SECRET: z.string().optional(),
  FRANCE_TRAVAIL_SCOPE: z.string().default('o2dsoffre api_offresdemploiv2'),
  FRANCE_TRAVAIL_BASE_URL: z
    .string()
    .url()
    .default('https://api.francetravail.io/partenaire/offresdemploi/v2'),
  FRANCE_TRAVAIL_AUTH_URL: z
    .string()
    .url()
    .default('https://entreprise.francetravail.fr/connexion/oauth2/access_token'),
});

export type WorkerEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  if (isProduction) {
    console.error('[env] Invalid environment variables', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables — aborting worker boot');
  }
  console.warn(
    '[env] Some environment variables are invalid (dev fallback applied):',
    parsed.error.flatten().fieldErrors,
  );
}

export const env: WorkerEnv = parsed.success ? parsed.data : (envSchema.parse({}) as WorkerEnv);

export const isObservabilityEnabled = {
  sentry: Boolean(env.SENTRY_DSN),
  axiom: Boolean(env.AXIOM_TOKEN),
};

export const isRedisConfigured = Boolean(env.REDIS_URL);

export const isFranceTravailConfigured = Boolean(
  env.FRANCE_TRAVAIL_CLIENT_ID && env.FRANCE_TRAVAIL_CLIENT_SECRET,
);
