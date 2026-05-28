import { Worker, type Job } from 'bullmq';
import { anonymizeUser } from '../lib/anonymize-user.js';
import { getRedisConnection } from '../lib/redis.js';
import { QUEUE_NAMES } from '../queues/index.js';
import logger from '../lib/logger.js';

/**
 * Worker `rgpd-anonymize-manual` (Story 8.4).
 *
 * Traite les anonymisations à la demande déclenchées par un admin depuis le
 * back-office. Réutilise la même fonction `anonymizeUser` que le job mensuel
 * (Story 6.6) — la seule différence est `reason='admin_manual'` et l'audit
 * log porte `actorType=ADMIN` avec l'id de l'admin déclencheur.
 *
 * Payload : `{ userId: string, triggeredByAdminId: string }`.
 */

type ManualAnonymizePayload = {
  userId: string;
  triggeredByAdminId: string;
};

let worker: Worker | null = null;

async function handle(job: Job<ManualAnonymizePayload>): Promise<{ outcome: string }> {
  const { userId, triggeredByAdminId } = job.data;
  logger.info({ jobId: job.id, userId }, 'rgpd-anonymize-manual job received');
  const outcome = await anonymizeUser({
    userId,
    reason: 'admin_manual',
    triggeredByAdminId,
  });
  logger.info({ jobId: job.id, userId, outcome }, 'rgpd-anonymize-manual job completed');
  return { outcome };
}

export async function startRgpdAnonymizeManualWorker(): Promise<Worker | null> {
  if (worker) return worker;
  const connection = getRedisConnection();
  if (!connection) {
    logger.warn('REDIS_URL absent — rgpd-anonymize-manual worker non démarré');
    return null;
  }

  worker = new Worker(QUEUE_NAMES.RGPD_ANONYMIZE_MANUAL, handle, {
    connection,
    concurrency: 1,
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, userId: job?.data?.userId, err },
      'rgpd-anonymize-manual job failed',
    );
  });

  logger.info('rgpd-anonymize-manual worker started');
  return worker;
}

export async function stopRgpdAnonymizeManualWorker(): Promise<void> {
  if (!worker) return;
  await worker.close();
  worker = null;
}
