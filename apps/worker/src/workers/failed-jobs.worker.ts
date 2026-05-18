import { Worker, type Job } from 'bullmq';
import { getRedisConnection } from '../lib/redis.js';
import { QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';

let worker: Worker | null = null;

/**
 * Worker `failed-jobs` (Story 2.1).
 *
 * Consume les jobs archivés (router depuis les autres workers après épuisement
 * des retries). V1 : log + ack — l'archivage en DB pour retry manuel admin
 * arrive en Story 8.x (back-office).
 */

async function processFailedJob(job: Job): Promise<{ ok: true }> {
  logger.warn(
    {
      jobId: job.id,
      originalQueue: job.data.originalQueue,
      originalJobName: job.data.jobName,
      errorMessage: job.data.errorMessage,
      attemptsMade: job.data.attemptsMade,
    },
    'Failed job archived',
  );
  return { ok: true };
}

export async function startFailedJobsWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — failed-jobs worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.FAILED_JOBS, processFailedJob, { connection });

  worker.on('failed', (job, err) => {
    // Inception : le worker des failed jobs lui-même peut échouer.
    // Pas de re-route (pour éviter une boucle), juste log fatal.
    logger.fatal({ jobId: job?.id, err }, 'failed-jobs worker itself failed');
  });

  logger.info('failed-jobs worker started');
  return worker;
}

export async function stopFailedJobsWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
