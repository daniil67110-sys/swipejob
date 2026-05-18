import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';

let worker: Worker | null = null;

/**
 * Worker `rgpd-delete` (Story 2.1 — wire le stub Story 1.10).
 *
 * V1 : ack le job + log. L'effective purge des données utilisateur (CV R2,
 * profil, candidatures, etc.) sous délai 30j sera implémentée en Story 6.5.
 */

async function processRgpdDeleteJob(job: Job): Promise<{ ok: true; userId: string }> {
  const userId = job.data?.userId as string | undefined;
  if (!userId) {
    throw new Error('rgpd-delete job missing userId in payload');
  }
  logger.warn(
    { jobId: job.id, userId },
    'rgpd-delete job received (V1 stub — effective purge implementation in Story 6.5)',
  );
  return { ok: true, userId };
}

export async function startRgpdDeleteWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — rgpd-delete worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.RGPD_DELETE, processRgpdDeleteJob, { connection });

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'rgpd-delete job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.RGPD_DELETE, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.RGPD_DELETE,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('rgpd-delete worker started');
  return worker;
}

export async function stopRgpdDeleteWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
