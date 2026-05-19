import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getCoachInterviewPrepQueue, getFailedJobsQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processInterviewPrepBatch } from '../jobs/coach-interview-prep.job.js';

let worker: Worker | null = null;

const JOB_NAME = 'interview-prep-scan';
// Toutes les heures à H+10 (décalage doux). Scan applications avec interview_at dans [+22h, +30h].
const PREP_CRON = '10 * * * *';

async function processPrepJob(job: Job) {
  logger.info({ jobId: job.id, name: job.name }, 'interview-prep job received');
  const result = await processInterviewPrepBatch();
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function schedulePrepCron(): Promise<void> {
  const queue = getCoachInterviewPrepQueue();
  if (!queue) return;
  try {
    await queue.add(JOB_NAME, {}, { repeat: { pattern: PREP_CRON }, jobId: `cron:${JOB_NAME}` });
    logger.info({ cron: PREP_CRON }, 'interview-prep cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule interview-prep cron — repeatable may exist');
  }
}

export async function startCoachInterviewPrepWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — coach-interview-prep worker non démarré');
    return null;
  }
  worker = new Worker(QUEUE_NAMES.COACH_INTERVIEW_PREP, processPrepJob, { connection });
  await schedulePrepCron();

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'interview-prep job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.COACH_INTERVIEW_PREP, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.COACH_INTERVIEW_PREP,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('coach-interview-prep worker started');
  return worker;
}

export async function stopCoachInterviewPrepWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
