import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processRgpdExportJob } from '../jobs/rgpd-export.job.js';

let worker: Worker | null = null;

async function handle(job: Job): Promise<{ ok: true; jobId: string; result: unknown }> {
  const userId = job.data?.userId as string | undefined;
  const exportId = job.data?.exportId as string | undefined;
  if (!userId || !exportId) {
    throw new Error('rgpd-export job missing userId/exportId');
  }
  logger.info({ jobId: job.id, userId, exportId }, 'rgpd-export job received');
  const result = await processRgpdExportJob({ userId, exportId });
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

export async function startRgpdExportWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — rgpd-export worker non démarré');
    return null;
  }
  worker = new Worker(QUEUE_NAMES.RGPD_EXPORT, handle, { connection });

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'rgpd-export job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.RGPD_EXPORT, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.RGPD_EXPORT,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('rgpd-export worker started');
  return worker;
}

export async function stopRgpdExportWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
