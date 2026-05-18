import 'server-only';
import { z } from 'zod';

const isProduction = process.env['NODE_ENV'] === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),

  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default('https://eu.i.posthog.com'),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_DISTINCT_ID_SALT: isProduction
    ? z.string().min(32, 'POSTHOG_DISTINCT_ID_SALT must be ≥32 chars in production').optional()
    : z.string().min(16).optional(),

  PII_EMAIL_HASH_SECRET: isProduction
    ? z.string().min(16, 'PII_EMAIL_HASH_SECRET must be ≥16 chars in production').optional()
    : z.string().optional(),

  NEXT_PUBLIC_APP_VERSION: z.string().optional(),

  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET_WEB: z.string().default('swipejob-web'),
  AXIOM_DATASET_AUDIT: z.string().default('swipejob-audit'),

  SITE_URL: z.string().url().default('http://localhost:3000'),

  // Auth.js v5 (Story 1.3 — TECH-003)
  // En prod : reste `optional()` au schema-level pour permettre le boot Next.js
  // (phase de collecte de pages). La validation runtime se fait via `isAuthConfigured`
  // ci-dessous + warn log si manquant en prod (cohérent pattern Story 1.2/1.2.5).
  AUTH_SECRET: z
    .string()
    .min(isProduction ? 32 : 1, 'AUTH_SECRET must be ≥32 chars in production')
    .optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // Email transactionnel (Story 1.4 — Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().email().default('noreply@swipejob.fr'),

  // Rate limiting (Story 1.4 — Upstash Redis EU Frankfurt)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Cloudflare R2 — CV/docs storage (Story 1.6)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // LLM (Story 1.7 — parsing CV)
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL: z.string().default('mistral-large-latest'),

  // BullMQ + Redis (Story 2.1) — partagé worker/web pour enqueue depuis Server Actions
  REDIS_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  if (isProduction) {
    console.error('[env] Invalid environment variables', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables — aborting boot');
  }
  console.warn(
    '[env] Some environment variables are invalid (dev fallback applied):',
    parsed.error.flatten().fieldErrors,
  );
}

export const env: Env = parsed.success
  ? parsed.data
  : (envSchema.parse({ NODE_ENV: process.env['NODE_ENV'] ?? 'development' }) as Env);

export const isObservabilityEnabled = {
  sentry: Boolean(env.SENTRY_DSN),
  posthogClient: Boolean(env.NEXT_PUBLIC_POSTHOG_KEY),
  posthogServer: Boolean(env.POSTHOG_API_KEY),
  axiom: Boolean(env.AXIOM_TOKEN),
};

export const isAuthConfigured = Boolean(
  env.AUTH_SECRET && env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET,
);

export const isEmailConfigured = Boolean(env.RESEND_API_KEY);
export const isRateLimitConfigured = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);

export const isR2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME,
);

export const isLlmConfigured = Boolean(env.MISTRAL_API_KEY);
export const isQueueConfigured = Boolean(env.REDIS_URL);

if (isProduction && !isAuthConfigured) {
  console.warn('[env] Auth is not fully configured in production — /inscription will be disabled.');
}

if (isProduction && !isEmailConfigured) {
  console.warn(
    '[env] RESEND_API_KEY missing in production — email/password signup will be disabled.',
  );
}

if (isProduction && !isRateLimitConfigured) {
  console.warn('[env] Upstash Redis missing in production — rate limiting disabled (NFR-S5 risk).');
}

if (isProduction && !isR2Configured) {
  console.warn('[env] Cloudflare R2 missing in production — CV upload will use mock mode.');
}

if (isProduction && !isLlmConfigured) {
  console.warn('[env] MISTRAL_API_KEY missing in production — CV parsing will use fallback.');
}

if (isProduction && !isQueueConfigured) {
  console.warn('[env] REDIS_URL missing in production — BullMQ enqueue will be mocked (no async).');
}
