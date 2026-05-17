import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../lib/env.js';
import { AUDIT_QUEUE_NAME } from '@swipejob/types';

let queue: Queue | null = null;

export function getAuditQueue(): Queue | null {
  if (queue) return queue;
  if (!env.REDIS_URL) return null;
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  queue = new Queue(AUDIT_QUEUE_NAME, { connection });
  return queue;
}

export async function closeAuditQueue(): Promise<void> {
  if (!queue) return;
  await queue.close();
  queue = null;
}
