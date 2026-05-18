import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getOfferIngestQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processIngestFranceTravail } from '../jobs/ingest-france-travail.job.js';
import { processIngestAdzuna } from '../jobs/ingest-adzuna.job.js';

let worker: Worker | null = null;

const FRANCE_TRAVAIL_JOB_NAME = 'france-travail';
const FRANCE_TRAVAIL_CRON = '*/30 * * * *'; // toutes les 30 min, début d'heure

const ADZUNA_JOB_NAME = 'adzuna';
const ADZUNA_CRON = '15,45 * * * *'; // décalé +15 min vs France Travail (étale la charge DB)

/**
 * Worker `offer-ingest` (Stories 2.2 + 2.3).
 *
 * Délègue par `job.name` :
 * - `france-travail` → `processIngestFranceTravail`
 * - `adzuna` → `processIngestAdzuna`
 * - Nouvelles sources (Story 2.x+) : ajouter une branche ici + 1 job + 1 cron.
 *
 * Repeatable BullMQ jobs (jobId fixe) → idempotent au restart.
 */

async function processOfferIngestJob(
  job: Job,
): Promise<{ ok: true; jobId: string; result: unknown }> {
  logger.info({ jobId: job.id, name: job.name }, 'offer-ingest job received');
  let result: unknown = null;
  if (job.name === FRANCE_TRAVAIL_JOB_NAME) {
    result = await processIngestFranceTravail();
  } else if (job.name === ADZUNA_JOB_NAME) {
    result = await processIngestAdzuna();
  } else {
    logger.warn({ jobName: job.name }, 'offer-ingest unknown job name — ignored');
  }
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function scheduleCron(name: string, pattern: string): Promise<void> {
  const queue = getOfferIngestQueue();
  if (!queue) return;
  try {
    await queue.add(name, {}, { repeat: { pattern }, jobId: `cron:${name}` });
    logger.info({ name, pattern }, 'cron scheduled');
  } catch (err) {
    logger.warn({ err, name }, 'Failed to schedule cron — repeatable job may already exist');
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

  // Schedule tous les crons (idempotent)
  await Promise.all([
    scheduleCron(FRANCE_TRAVAIL_JOB_NAME, FRANCE_TRAVAIL_CRON),
    scheduleCron(ADZUNA_JOB_NAME, ADZUNA_CRON),
  ]);

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
