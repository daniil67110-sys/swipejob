import 'server-only';
import { Queue, type JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { env, isQueueConfigured } from './env';
import { serverLogger as logger } from './logger.server';

/**
 * Web client BullMQ pour enqueue depuis Server Actions / Route Handlers (Story 2.1).
 * Côté worker, voir `apps/worker/src/queues/index.ts` (mêmes noms de queues).
 *
 * Mode conditionnel : sans REDIS_URL → enqueue retourne `{ ok: true, mock: true }`
 * et log un warn. Permet le dev/CI sans Redis local.
 */

export const QUEUE_NAMES = {
  CV_PARSE: 'cv-parse',
  RGPD_DELETE: 'rgpd-delete',
  OFFER_INGEST: 'offer-ingest',
  MATCH_COMPUTE: 'match-compute',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

let connection: Redis | null = null;
const queues = new Map<QueueName, Queue>();

function getConnection(): Redis | null {
  if (connection) return connection;
  if (!isQueueConfigured || !env.REDIS_URL) return null;
  connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 1000, 30_000),
  });
  return connection;
}

function getQueue(name: QueueName): Queue | null {
  const cached = queues.get(name);
  if (cached) return cached;
  const conn = getConnection();
  if (!conn) return null;
  const q = new Queue(name, { connection: conn, defaultJobOptions: DEFAULT_JOB_OPTIONS });
  queues.set(name, q);
  return q;
}

export type EnqueueResult =
  | { ok: true; jobId: string; mock?: false }
  | { ok: true; jobId: null; mock: true }
  | { ok: false; error: string };

export async function enqueueCvParse(payload: {
  cvId: string;
  userId: string;
}): Promise<EnqueueResult> {
  const q = getQueue(QUEUE_NAMES.CV_PARSE);
  if (!q) {
    logger.warn({ payload }, 'cv-parse enqueue mock (REDIS_URL absent)');
    return { ok: true, jobId: null, mock: true };
  }
  try {
    const job = await q.add('parse', payload);
    return { ok: true, jobId: job.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, payload }, 'cv-parse enqueue failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

export async function enqueueMatchComputeFirst(payload: {
  userId: string;
}): Promise<EnqueueResult> {
  const q = getQueue(QUEUE_NAMES.MATCH_COMPUTE);
  if (!q) {
    logger.warn({ userId: payload.userId }, 'match-compute-first enqueue mock');
    return { ok: true, jobId: null, mock: true };
  }
  try {
    const job = await q.add('compute-first', payload, { priority: 1 });
    return { ok: true, jobId: job.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, payload }, 'match-compute-first enqueue failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

export async function enqueueRgpdDelete(payload: { userId: string }): Promise<EnqueueResult> {
  const q = getQueue(QUEUE_NAMES.RGPD_DELETE);
  if (!q) {
    logger.warn({ userId: payload.userId }, 'rgpd-delete enqueue mock (REDIS_URL absent)');
    return { ok: true, jobId: null, mock: true };
  }
  try {
    const job = await q.add('purge', payload, {
      // Délai 30 jours avant exécution effective (RGPD grace period).
      delay: 30 * 24 * 3600 * 1000,
    });
    return { ok: true, jobId: job.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, payload }, 'rgpd-delete enqueue failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
