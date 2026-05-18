import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getOfferIngestQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processIngestFranceTravail } from '../jobs/ingest-france-travail.job.js';

let worker: Worker | null = null;

const FRANCE_TRAVAIL_JOB_NAME = 'france-travail';
const FRANCE_TRAVAIL_CRON = '*/30 * * * *'; // toutes les 30 min

/**
 * Worker `offer-ingest` (Story 2.2).
 *
 * Délègue par `job.name` :
 * - `france-travail` → `processIngestFranceTravail`
 * - Autres sources (Story 2.3+) ajouteront leurs branches ici.
 *
 * Repeatable BullMQ job (cron toutes les 30 min) enregistré au boot.
 * jobId fixe → idempotent (BullMQ dedupe sur restart).
 */

async function processOfferIngestJob(
  job: Job,
): Promise<{ ok: true; jobId: string; result: unknown }> {
  logger.info({ jobId: job.id, name: job.name }, 'offer-ingest job received');
  let result: unknown = null;
  if (job.name === FRANCE_TRAVAIL_JOB_NAME) {
    result = await processIngestFranceTravail();
  } else {
    logger.warn({ jobName: job.name }, 'offer-ingest unknown job name — ignored');
  }
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function scheduleFranceTravailCron(): Promise<void> {
  const queue = getOfferIngestQueue();
  if (!queue) return;
  try {
    await queue.add(
      FRANCE_TRAVAIL_JOB_NAME,
      {},
      {
        repeat: { pattern: FRANCE_TRAVAIL_CRON },
        jobId: `cron:${FRANCE_TRAVAIL_JOB_NAME}`,
      },
    );
    logger.info({ cron: FRANCE_TRAVAIL_CRON }, 'France Travail cron scheduled');
  } catch (err) {
    logger.warn(
      { err },
      'Failed to schedule France Travail cron — repeatable job may already exist',
    );
  }
}

export async function startOfferIngestWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — offer-ingest worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.OFFER_INGEST, processOfferIngestJob, { connection });

  // Schedule le cron France Travail (idempotent)
  await scheduleFranceTravailCron();

  worker.on('failed', async (job, err) => {
    logger.error(
      { jobId: job?.id, name: job?.name, err, attempts: job?.attemptsMade },
      'offer-ingest job failed',
    );
    // Si on a épuisé les retries, route vers failed-jobs pour archivage
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.OFFER_INGEST, jobName: job.name },
        extra: { jobId: job.id, attemptsMade: job.attemptsMade },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.OFFER_INGEST,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'offer-ingest job completed');
  });

  logger.info('offer-ingest worker started');
  return worker;
}

export async function stopOfferIngestWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
