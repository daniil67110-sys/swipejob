import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processApplication } from '../jobs/process-application.job.js';

let worker: Worker | null = null;

async function handle(job: Job): Promise<{ ok: true; jobId: string; result: unknown }> {
  logger.info({ jobId: job.id, name: job.name }, 'application-process job received');
  const applicationId = job.data?.applicationId as string | undefined;
  const skipReview = Boolean(job.data?.skipReview);
  if (!applicationId) throw new Error('application-process job missing applicationId');
  const result = await processApplication(applicationId, { skipReview });
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

export async function startApplicationProcessWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — application-process worker non démarré');
    return null;
  }
  worker = new Worker(QUEUE_NAMES.APPLICATION_PROCESS, handle, { connection });

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'application-process job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.APPLICATION_PROCESS, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.APPLICATION_PROCESS,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('application-process worker started');
  return worker;
}

export async function stopApplicationProcessWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
