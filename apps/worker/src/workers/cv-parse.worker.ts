import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';

let worker: Worker | null = null;

/**
 * Worker `cv-parse` (Story 2.1 — wire le stub Story 1.7).
 *
 * V1 : ack le job. L'implémentation actuelle du parsing est dans
 * `apps/web/app/api/cv/parse/route.ts` (sync inline, Story 1.7). À terme,
 * ce worker reprendra ce code en async via worker thread (out of scope V1).
 */

async function processCvParseJob(job: Job): Promise<{ ok: true; cvId: string }> {
  const cvId = job.data?.cvId as string | undefined;
  if (!cvId) {
    throw new Error('cv-parse job missing cvId in payload');
  }
  logger.info(
    { jobId: job.id, cvId },
    'cv-parse job received (V1 stub — sync inline web Story 1.7)',
  );
  return { ok: true, cvId };
}

export async function startCvParseWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — cv-parse worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.CV_PARSE, processCvParseJob, { connection });

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'cv-parse job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.CV_PARSE, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.CV_PARSE,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('cv-parse worker started');
  return worker;
}

export async function stopCvParseWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
