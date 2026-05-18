import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getOfferDedupeQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processDedupeOffers } from '../jobs/dedupe-offers.job.js';

let worker: Worker | null = null;

const DEDUPE_JOB_NAME = 'dedupe';
const DEDUPE_CRON = '10,30,50 * * * *'; // toutes les 20 min, décalé +5 vs normalize

async function processDedupeJob(job: Job): Promise<{ ok: true; jobId: string; result: unknown }> {
  logger.info({ jobId: job.id, name: job.name }, 'offer-dedupe job received');
  const result = await processDedupeOffers();
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function scheduleDedupeCron(): Promise<void> {
  const queue = getOfferDedupeQueue();
  if (!queue) return;
  try {
    await queue.add(
      DEDUPE_JOB_NAME,
      {},
      { repeat: { pattern: DEDUPE_CRON }, jobId: `cron:${DEDUPE_JOB_NAME}` },
    );
    logger.info({ cron: DEDUPE_CRON }, 'offer-dedupe cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule dedupe cron — repeatable may exist');
  }
}

export async function startOfferDedupeWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — offer-dedupe worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.OFFER_DEDUPE, processDedupeJob, { connection });
  await scheduleDedupeCron();

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'offer-dedupe job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.OFFER_DEDUPE, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.OFFER_DEDUPE,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('offer-dedupe worker started');
  return worker;
}

export async function stopOfferDedupeWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
