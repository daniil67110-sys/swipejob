import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getMatchComputeQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processComputeMatches } from '../jobs/compute-matches.job.js';

let worker: Worker | null = null;

const MATCH_JOB_NAME = 'compute';
const MATCH_CRON = '0 2 * * *'; // 02h UTC nocturne (Story 2.8)

async function processJob(job: Job): Promise<{ ok: true; jobId: string; result: unknown }> {
  logger.info({ jobId: job.id, name: job.name }, 'match-compute job received');
  const result = await processComputeMatches();
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function scheduleCron(): Promise<void> {
  const queue = getMatchComputeQueue();
  if (!queue) return;
  try {
    await queue.add(
      MATCH_JOB_NAME,
      {},
      { repeat: { pattern: MATCH_CRON }, jobId: `cron:${MATCH_JOB_NAME}` },
    );
    logger.info({ cron: MATCH_CRON }, 'match-compute cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule match-compute cron');
  }
}

export async function startMatchComputeWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — match-compute worker non démarré');
    return null;
  }
  worker = new Worker(QUEUE_NAMES.MATCH_COMPUTE, processJob, { connection });
  await scheduleCron();

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'match-compute job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.MATCH_COMPUTE, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.MATCH_COMPUTE,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('match-compute worker started');
  return worker;
}

export async function stopMatchComputeWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
