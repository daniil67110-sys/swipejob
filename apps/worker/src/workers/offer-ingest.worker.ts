import { Worker, type Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getRedisConnection } from '../lib/redis.js';
import { getFailedJobsQueue, QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';

let worker: Worker | null = null;

/**
 * Worker `offer-ingest` (Story 2.1).
 *
 * V1 : stub qui ack le job sans rien faire (l'implémentation France Travail
 * arrive en Story 2.2). Le but de cette story est juste de prouver que la
 * chaîne queue → worker → ack → log fonctionne.
 *
 * En cas d'épuisement des retries, le job est republié sur `failed-jobs`
 * pour archivage + alerte Sentry.
 */

async function processOfferIngestJob(job: Job): Promise<{ ok: true; jobId: string }> {
  logger.info({ jobId: job.id, name: job.name, data: job.data }, 'offer-ingest job received');
  // V1 stub : Story 2.2 implémentera fetch France Travail + insert offers.
  return { ok: true, jobId: job.id ?? 'unknown' };
}

export async function startOfferIngestWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — offer-ingest worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.OFFER_INGEST, processOfferIngestJob, { connection });

  worker.on('failed', async (job, err) => {
    logger.error(
      { jobId: job?.id, name: job?.name, err, attempts: job?.attemptsMade },
      'offer-ingest job failed',
    );
    // Si on a épuisé les retries, route vers failed-jobs pour archivage
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.OFFER_INGEST, jobName: job.name },
        extra: { jobId: job.id, attemptsMade: job.attemptsMade },
      });
      const failedQueue = getFailedJobsQueue();
      if (failedQueue) {
        await failedQueue.add('archived', {
          originalQueue: QUEUE_NAMES.OFFER_INGEST,
          jobName: job.name,
          payload: job.data,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
      }
    }
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'offer-ingest job completed');
  });

  logger.info('offer-ingest worker started');
  return worker;
}

export async function stopOfferIngestWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
