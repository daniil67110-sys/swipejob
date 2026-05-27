import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getRgpdAnonymizeInactiveQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processAnonymizeInactiveJob } from '../jobs/rgpd-anonymize-inactive.job.js';

/**
 * Worker `rgpd-anonymize-inactive` (Story 6.6).
 *
 * Cron mensuel : 1er du mois à 04:00 UTC (décalé d'1h après audit export
 * pour ne pas saturer la DB). Toutes les exécutions sont auto-déclenchées
 * par BullMQ repeatable ; pas d'enqueue manuel attendu en V1.
 */
const ANONYMIZE_INACTIVE_CRON = '0 4 1 * *';
const ANONYMIZE_INACTIVE_JOB_NAME = 'monthly-scan';

let worker: Worker | null = null;

async function handle(job: Job): Promise<unknown> {
  logger.info({ jobId: job.id }, 'rgpd-anonymize-inactive job received');
  return processAnonymizeInactiveJob(job);
}

export async function startRgpdAnonymizeInactiveWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — rgpd-anonymize-inactive worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.RGPD_ANONYMIZE_INACTIVE, handle, { connection });

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'rgpd-anonymize-inactive job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.RGPD_ANONYMIZE_INACTIVE, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.RGPD_ANONYMIZE_INACTIVE,
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
    logger.info({ jobId: job.id, result }, 'rgpd-anonymize-inactive completed');
  });

  // Schedule monthly repeatable (idempotent — BullMQ dédupe par repeat key).
  const queue = getRgpdAnonymizeInactiveQueue();
  if (queue) {
    await queue.add(
      ANONYMIZE_INACTIVE_JOB_NAME,
      { triggeredBy: 'cron' },
      { repeat: { pattern: ANONYMIZE_INACTIVE_CRON, tz: 'UTC' } },
    );
    logger.info({ cron: ANONYMIZE_INACTIVE_CRON }, 'rgpd-anonymize-inactive cron scheduled');
  }

  logger.info('rgpd-anonymize-inactive worker started');
  return worker;
}

export async function stopRgpdAnonymizeInactiveWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
