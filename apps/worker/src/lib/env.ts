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

  // Adzuna API (Story 2.3) — source secondaire
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  ADZUNA_BASE_URL: z.string().url().default('https://api.adzuna.com/v1/api/jobs/fr'),

  // Mistral API (Story 2.8 — embeddings, Story 3.5 — cover letter chat)
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_EMBED_MODEL: z.string().default('mistral-embed'),
  MISTRAL_MODEL: z.string().default('mistral-large-latest'),

  // Story 2.8 + 2.9 : kill switch IA matching (NFR-F5).
  IA_MATCHING_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  // Resend transactionnel (Story 3.6 — envoi candidatures)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().email().default('noreply@swipejob.fr'),

  // Cloudflare R2 (Story 3.6 — download CV pour pièce jointe)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
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

export const isAdzunaConfigured = Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY);

export const isMistralConfigured = Boolean(env.MISTRAL_API_KEY);

export const isResendConfigured = Boolean(env.RESEND_API_KEY);

export const isR2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME,
);
