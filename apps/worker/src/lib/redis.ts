import { Redis } from 'ioredis';
import { env, isRedisConfigured } from './env.js';
import logger from './logger.js';

let connection: Redis | null = null;

/**
 * Connexion Redis singleton pour le worker (BullMQ).
 *
 * - `maxRetriesPerRequest: null` requis par BullMQ (sinon les blocking calls
 *   échouent après N retries).
 * - `enableReadyCheck: false` accélère le boot quand Upstash met du temps.
 * - `retryStrategy` exponentiel (cap 30s) — circuit breaker basique.
 */
export function getRedisConnection(): Redis | null {
  if (connection) return connection;
  if (!isRedisConfigured || !env.REDIS_URL) {
    logger.warn('REDIS_URL not set — Redis-dependent features disabled');
    return null;
  }

  connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 1000, 30_000);
      logger.warn({ attempt: times, nextRetryMs: delay }, 'Redis reconnecting');
      return delay;
    },
  });

  connection.on('connect', () => logger.info('Redis connected'));
  connection.on('error', (err) => logger.error({ err }, 'Redis error'));
  connection.on('close', () => logger.warn('Redis connection closed'));

  return connection;
}

export async function closeRedis(): Promise<void> {
  if (!connection) return;
  await connection.quit();
  connection = null;
}

export async function isRedisHealthy(): Promise<boolean> {
  const conn = getRedisConnection();
  if (!conn) return false;
  try {
    const res = await conn.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}
