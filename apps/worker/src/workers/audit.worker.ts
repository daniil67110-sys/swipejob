import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { AUDIT_EXPORT_CRON, AUDIT_EXPORT_JOB_NAME, AUDIT_QUEUE_NAME } from '@swipejob/types';
import { env } from '../lib/env.js';
import logger from '../lib/logger.js';
import { processAuditExport } from '../jobs/audit-export-monthly.job.js';
import { closeAuditQueue, getAuditQueue } from '../queues/audit.queue.js';

let worker: Worker | null = null;

export async function startAuditWorker(): Promise<Worker | null> {
  if (worker) return worker;
  if (!env.REDIS_URL) {
    logger.warn('REDIS_URL absent — audit worker non démarré (mode local sans Redis).');
    return null;
  }

  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  worker = new Worker(
    AUDIT_QUEUE_NAME,
    async (job) => {
      if (job.name === AUDIT_EXPORT_JOB_NAME) {
        return processAuditExport(job);
      }
      logger.warn({ jobName: job.name }, 'Unknown audit job name — ignoring.');
      return null;
    },
    { connection },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'audit worker — job failed');
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'audit worker — job completed');
  });

  // Schedule monthly cron via repeatable job (idempotent — BullMQ dedupe par repeat key)
  const queue = getAuditQueue();
  if (queue) {
    await queue.add(
      AUDIT_EXPORT_JOB_NAME,
      { month: previousMonth(), triggeredBy: 'cron' },
      { repeat: { pattern: AUDIT_EXPORT_CRON, tz: 'UTC' } },
    );
    logger.info({ cron: AUDIT_EXPORT_CRON }, 'Audit export cron scheduled');
  }

  return worker;
}

export async function stopAuditWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await closeAuditQueue();
}

function previousMonth(): string {
  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
}
