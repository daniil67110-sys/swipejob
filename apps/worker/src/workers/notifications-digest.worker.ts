import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getNotificationsDigestQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processWeeklyDigest } from '../jobs/notifications-digest.job.js';

let worker: Worker | null = null;

const JOB_NAME = 'weekly-digest';
// Dimanche 19h Europe/Paris ≈ 17h UTC (été) ou 18h UTC (hiver). BullMQ cron est en UTC.
// On utilise 17h UTC → 19h Paris en été. En hiver le digest partira à 18h Paris (acceptable V1).
// V2 : timezone option via BullMQ 5.
const DIGEST_CRON = '0 17 * * 0';

async function processDigestJob(job: Job) {
  logger.info({ jobId: job.id, name: job.name }, 'weekly-digest job received');
  const result = await processWeeklyDigest();
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function scheduleDigestCron(): Promise<void> {
  const queue = getNotificationsDigestQueue();
  if (!queue) return;
  try {
    await queue.add(JOB_NAME, {}, { repeat: { pattern: DIGEST_CRON }, jobId: `cron:${JOB_NAME}` });
    logger.info({ cron: DIGEST_CRON }, 'weekly-digest cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule weekly-digest cron — repeatable may exist');
  }
}

export async function startNotificationsDigestWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — notifications-digest worker non démarré');
    return null;
  }
  worker = new Worker(QUEUE_NAMES.NOTIFICATIONS_DIGEST, processDigestJob, { connection });
  await scheduleDigestCron();

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'weekly-digest job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.NOTIFICATIONS_DIGEST, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.NOTIFICATIONS_DIGEST,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('notifications-digest worker started');
  return worker;
}

export async function stopNotificationsDigestWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
