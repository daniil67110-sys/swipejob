import { env, isWebPushConfigured } from './env.js';
import logger from './logger.js';

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  icon?: string;
};

export type PushTarget = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushResult =
  | { ok: true; status: number }
  | { ok: true; mock: true }
  | { ok: false; error: string; gone: boolean };

let cached: typeof import('web-push') | null = null;
async function getWebPush(): Promise<typeof import('web-push') | null> {
  if (!isWebPushConfigured) return null;
  if (cached) return cached;
  try {
    cached = await import('web-push');
    cached.setVapidDetails(
      env.WEB_PUSH_VAPID_SUBJECT,
      env.WEB_PUSH_VAPID_PUBLIC_KEY!,
      env.WEB_PUSH_VAPID_PRIVATE_KEY!,
    );
    return cached;
  } catch (err) {
    logger.warn({ err }, 'web-push module not installed — push send falling back to mock');
    return null;
  }
}

/**
 * Story 4.4 — Envoi Web Push.
 *
 * Renvoie `gone=true` si la subscription est expirée (404/410), pour que le caller
 * puisse la supprimer en DB.
 */
export async function sendWebPush(target: PushTarget, payload: PushPayload): Promise<PushResult> {
  const wp = await getWebPush();
  if (!wp) {
    logger.warn({ endpoint: redact(target.endpoint) }, 'web-push not configured — mock send');
    return { ok: true, mock: true };
  }
  try {
    const res = await wp.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      { TTL: 60 },
    );
    return { ok: true, status: res.statusCode };
  } catch (err) {
    const error = err as { statusCode?: number; message?: string };
    const gone = error.statusCode === 404 || error.statusCode === 410;
    const msg = error.message ?? String(err);
    logger.warn({ status: error.statusCode, err: msg }, 'web-push send failed');
    return { ok: false, error: msg, gone };
  }
}

function redact(endpoint: string): string {
  return endpoint.replace(/(.{20}).+/, '$1***');
}
