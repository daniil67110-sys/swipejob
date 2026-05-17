import 'server-only';
import { createHmac } from 'node:crypto';
import { PostHog } from 'posthog-node';
import { env, isObservabilityEnabled } from './env.js';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!isObservabilityEnabled.posthogServer) return null;
  if (client) return client;
  client = new PostHog(env.POSTHOG_API_KEY!, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: env.NODE_ENV === 'production' ? 20 : 1,
    flushInterval: env.NODE_ENV === 'production' ? 10_000 : 1_000,
  });
  return client;
}

export function captureServer(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>,
): void {
  const c = getClient();
  if (!c) return;
  c.capture({ distinctId, event, properties });
}

export async function shutdownAnalytics(): Promise<void> {
  if (!client) return;
  await client.shutdown();
  client = null;
}

export function hashUserId(userId: string): string {
  if (env.NODE_ENV === 'production' && !env.POSTHOG_DISTINCT_ID_SALT) {
    throw new Error('POSTHOG_DISTINCT_ID_SALT is required in production');
  }
  const salt = env.POSTHOG_DISTINCT_ID_SALT ?? 'dev-salt-not-for-production';
  return createHmac('sha256', salt).update(userId).digest('hex');
}
