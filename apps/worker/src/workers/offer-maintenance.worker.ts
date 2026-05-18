import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, getOfferMaintenanceQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';
import { processDeactivateOffers } from '../jobs/deactivate-offers.job.js';
import { processMonitorCatalog } from '../jobs/monitor-catalog.job.js';

let worker: Worker | null = null;

const DEACTIVATE_JOB_NAME = 'deactivate';
const DEACTIVATE_CRON = '0 3 * * *'; // quotidien 03h UTC

const MONITOR_JOB_NAME = 'monitor-catalog';
const MONITOR_CRON = '15 3 * * *'; // 15 min après deactivate (Story 2.7)

/**
 * Worker `offer-maintenance` (Story 2.6).
 *
 * Queue générique pour tous les jobs de maintenance offres :
 * - `deactivate` : expirer + archiver les offres mortes (V1)
 * - `archive-pii` : nullifier PII anciens (futur, fusionné dans deactivate V1)
 * - Autres jobs V2 (refresh sources stale, etc.)
 *
 * Cron quotidien 03h UTC.
 */

async function processMaintenanceJob(
  job: Job,
): Promise<{ ok: true; jobId: string; result: unknown }> {
  logger.info({ jobId: job.id, name: job.name }, 'offer-maintenance job received');
  let result: unknown = null;
  if (job.name === DEACTIVATE_JOB_NAME) {
    result = await processDeactivateOffers();
  } else if (job.name === MONITOR_JOB_NAME) {
    result = await processMonitorCatalog();
  } else {
    logger.warn({ jobName: job.name }, 'offer-maintenance unknown job name — ignored');
  }
  return { ok: true, jobId: job.id ?? 'unknown', result };
}

async function scheduleMaintenanceCron(): Promise<void> {
  const queue = getOfferMaintenanceQueue();
  if (!queue) return;
  try {
    await queue.add(
      DEACTIVATE_JOB_NAME,
      {},
      { repeat: { pattern: DEACTIVATE_CRON }, jobId: `cron:${DEACTIVATE_JOB_NAME}` },
    );
    logger.info({ cron: DEACTIVATE_CRON }, 'offer-maintenance deactivate cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule deactivate cron — repeatable may exist');
  }
  try {
    await queue.add(
      MONITOR_JOB_NAME,
      {},
      { repeat: { pattern: MONITOR_CRON }, jobId: `cron:${MONITOR_JOB_NAME}` },
    );
    logger.info({ cron: MONITOR_CRON }, 'offer-maintenance monitor-catalog cron scheduled');
  } catch (err) {
    logger.warn({ err }, 'Failed to schedule monitor-catalog cron — repeatable may exist');
  }
}

export async function startOfferMaintenanceWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — offer-maintenance worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.OFFER_MAINTENANCE, processMaintenanceJob, { connection });
  await scheduleMaintenanceCron();

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err }, 'offer-maintenance job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.OFFER_MAINTENANCE, jobName: job.name },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.OFFER_MAINTENANCE,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  logger.info('offer-maintenance worker started');
  return worker;
}

export async function stopOfferMaintenanceWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
