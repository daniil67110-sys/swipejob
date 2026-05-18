import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getOfferNormalizeQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processNormalizeOffers } from '../jobs/normalize-offers.job.js';

let worker: Worker | null = null;

const NORMALIZE_JOB_NAME = 'normalize';
const NORMALIZE_CRON = '5,25,45 * * * *'; // toutes les 20 min, décalé +5 vs ingest

/**
 * Worker `offer-normalize` (Story 2.4).
 *
 * Consume queue + délègue à `processNormalizeOffers` (batch 500 offres /
 * appel, idempotent via `normalized_at IS NULL`).
 *
 * Trigger : (a) cron toutes les 20 min, (b) enqueue manuel post-ingest
 * (depuis ingest-france-travail / ingest-adzuna jobs).
 */

async function processNormalizeJob(
  job: Job,
): Promise<{ ok: true; jobId: string; result: unknown }> {
  logger.info({ jobId: job.id, name: job.name }, 'normalize-offers job received');
  const result = await processNormalizeOffers();
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function scheduleNormalizeCron(): Promise<void> {
  const queue = getOfferNormalizeQueue();
  if (!queue) return;
  try {
    await queue.add(
      NORMALIZE_JOB_NAME,
      {},
      { repeat: { pattern: NORMALIZE_CRON }, jobId: `cron:${NORMALIZE_JOB_NAME}` },
    );
    logger.info({ cron: NORMALIZE_CRON }, 'normalize-offers cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule normalize cron — repeatable may exist');
  }
}

export async function startNormalizeOffersWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — normalize-offers worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.OFFER_NORMALIZE, processNormalizeJob, { connection });
  await scheduleNormalizeCron();

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'normalize-offers job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.OFFER_NORMALIZE, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.OFFER_NORMALIZE,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('normalize-offers worker started');
  return worker;
}

export async function stopNormalizeOffersWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
