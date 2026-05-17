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
