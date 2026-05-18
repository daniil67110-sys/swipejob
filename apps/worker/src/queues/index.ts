import { Queue, type JobsOptions } from 'bullmq';
import { getRedisConnection } from '../lib/redis.js';
import logger from '../lib/logger.js';

/**
 * Queues BullMQ SwipeJob (Story 2.1).
 *
 * Convention nommage : kebab-case, préfixe domaine. Toutes les queues partagent
 * la même politique de retry (3 tentatives, backoff exponentiel 5s).
 *
 * `failed-jobs` est une queue spéciale : les jobs des autres queues qui ont
 * épuisé leurs retries y sont republiés pour archivage + alerte Sentry.
 *
 * Le mode conditionnel (sans REDIS_URL) retourne `null` partout — boot OK pour
 * CI/dev sans Redis local.
 */

export const QUEUE_NAMES = {
  OFFER_INGEST: 'offer-ingest',
  OFFER_NORMALIZE: 'offer-normalize',
  OFFER_DEDUPE: 'offer-dedupe',
  OFFER_MAINTENANCE: 'offer-maintenance',
  EMBEDDINGS_COMPUTE: 'embeddings-compute',
  MATCH_COMPUTE: 'match-compute',
  CV_PARSE: 'cv-parse',
  RGPD_DELETE: 'rgpd-delete',
  APPLICATION_PROCESS: 'application-process',
  FAILED_JOBS: 'failed-jobs',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue | null {
  const cached = queues.get(name);
  if (cached) return cached;
  const connection = getRedisConnection();
  if (!connection) return null;
  const q = new Queue(name, { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS });
  queues.set(name, q);
  return q;
}

export function getOfferIngestQueue() {
  return getQueue(QUEUE_NAMES.OFFER_INGEST);
}
export function getOfferNormalizeQueue() {
  return getQueue(QUEUE_NAMES.OFFER_NORMALIZE);
}
export function getOfferDedupeQueue() {
  return getQueue(QUEUE_NAMES.OFFER_DEDUPE);
}
export function getOfferMaintenanceQueue() {
  return getQueue(QUEUE_NAMES.OFFER_MAINTENANCE);
}
export function getEmbeddingsComputeQueue() {
  return getQueue(QUEUE_NAMES.EMBEDDINGS_COMPUTE);
}
export function getMatchComputeQueue() {
  return getQueue(QUEUE_NAMES.MATCH_COMPUTE);
}
export function getCvParseQueue() {
  return getQueue(QUEUE_NAMES.CV_PARSE);
}
export function getRgpdDeleteQueue() {
  return getQueue(QUEUE_NAMES.RGPD_DELETE);
}
export function getApplicationProcessQueue() {
  return getQueue(QUEUE_NAMES.APPLICATION_PROCESS);
}
export function getFailedJobsQueue() {
  return getQueue(QUEUE_NAMES.FAILED_JOBS);
}

export type QueueStats = {
  active: number;
  waiting: number;
  failed: number;
  completed: number;
  delayed: number;
};

export async function getAllQueueStats(): Promise<Record<string, QueueStats | null>> {
  const stats: Record<string, QueueStats | null> = {};
  for (const name of Object.values(QUEUE_NAMES)) {
    const q = queues.get(name);
    if (!q) {
      stats[name] = null;
      continue;
    }
    try {
      const [active, waiting, failed, completed, delayed] = await Promise.all([
        q.getActiveCount(),
        q.getWaitingCount(),
        q.getFailedCount(),
        q.getCompletedCount(),
        q.getDelayedCount(),
      ]);
      stats[name] = { active, waiting, failed, completed, delayed };
    } catch (err) {
      logger.warn({ err, queue: name }, 'Failed to get queue stats');
      stats[name] = null;
    }
  }
  return stats;
}

export async function closeAllQueues(): Promise<void> {
  for (const [name, q] of queues) {
    try {
      await q.close();
      logger.info({ queue: name }, 'Queue closed');
    } catch (err) {
      logger.warn({ err, queue: name }, 'Failed to close queue');
    }
  }
  queues.clear();
}

export function initializeAllQueues(): number {
  // Force lazy init de toutes les queues au démarrage du worker.
  let initialized = 0;
  for (const name of Object.values(QUEUE_NAMES)) {
    if (getQueue(name)) initialized++;
  }
  return initialized;
}
