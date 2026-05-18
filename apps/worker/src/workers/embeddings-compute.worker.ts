import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getEmbeddingsComputeQueue, getFailedJobsQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processComputeEmbeddings } from '../jobs/compute-embeddings.job.js';

let worker: Worker | null = null;

const EMBED_JOB_NAME = 'compute';
const EMBED_CRON = '20,40 * * * *'; // 20 et 40 (toutes les 20 min, alterné vs dedupe)

async function processJob(job: Job): Promise<{ ok: true; jobId: string; result: unknown }> {
  logger.info({ jobId: job.id, name: job.name }, 'embeddings-compute job received');
  const result = await processComputeEmbeddings();
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function scheduleCron(): Promise<void> {
  const queue = getEmbeddingsComputeQueue();
  if (!queue) return;
  try {
    await queue.add(
      EMBED_JOB_NAME,
      {},
      { repeat: { pattern: EMBED_CRON }, jobId: `cron:${EMBED_JOB_NAME}` },
    );
    logger.info({ cron: EMBED_CRON }, 'embeddings-compute cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule embeddings cron');
  }
}

export async function startEmbeddingsComputeWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — embeddings-compute worker non démarré');
    return null;
  }
  worker = new Worker(QUEUE_NAMES.EMBEDDINGS_COMPUTE, processJob, { connection });
  await scheduleCron();

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'embeddings-compute job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.EMBEDDINGS_COMPUTE, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.EMBEDDINGS_COMPUTE,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('embeddings-compute worker started');
  return worker;
}

export async function stopEmbeddingsComputeWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
