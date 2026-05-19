import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getNotificationsPushQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processDailyDeckPush } from '../jobs/notifications-push.job.js';

let worker: Worker | null = null;

const JOB_NAME = 'daily-deck-push';
// 08:00 UTC = 10:00 Paris été / 09:00 Paris hiver.
// V2 : sharding par fuseau utilisateur via plusieurs crons.
const PUSH_CRON = '0 8 * * *';

async function processPushJob(job: Job) {
  logger.info({ jobId: job.id, name: job.name }, 'daily-deck-push job received');
  const result = await processDailyDeckPush();
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function schedulePushCron(): Promise<void> {
  const queue = getNotificationsPushQueue();
  if (!queue) return;
  try {
    await queue.add(JOB_NAME, {}, { repeat: { pattern: PUSH_CRON }, jobId: `cron:${JOB_NAME}` });
    logger.info({ cron: PUSH_CRON }, 'daily-deck-push cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule daily-deck-push cron — repeatable may exist');
  }
}

export async function startNotificationsPushWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — notifications-push worker non démarré');
    return null;
  }
  worker = new Worker(QUEUE_NAMES.NOTIFICATIONS_PUSH, processPushJob, { connection });
  await schedulePushCron();

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'daily-deck-push job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.NOTIFICATIONS_PUSH, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.NOTIFICATIONS_PUSH,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('notifications-push worker started');
  return worker;
}

export async function stopNotificationsPushWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
