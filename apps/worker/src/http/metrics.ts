import { getAllQueueStats } from '../queues/index.js';
import { isRedisHealthy } from '../lib/redis.js';

/**
 * Format Prometheus texte (Story 2.1 AC5).
 * Scrapable par Grafana Cloud / Prometheus / Vector.
 */
export async function buildMetricsResponse(): Promise<string> {
  const lines: string[] = [];
  const redisOk = await isRedisHealthy();
  const stats = await getAllQueueStats();

  lines.push('# HELP swipejob_redis_connected Redis connection status (0 or 1)');
  lines.push('# TYPE swipejob_redis_connected gauge');
  lines.push(`swipejob_redis_connected ${redisOk ? 1 : 0}`);
  lines.push('');

  lines.push('# HELP swipejob_queue_jobs Number of jobs by queue and state');
  lines.push('# TYPE swipejob_queue_jobs gauge');

  for (const [queue, s] of Object.entries(stats)) {
    if (!s) continue;
    lines.push(`swipejob_queue_jobs{queue="${queue}",state="active"} ${s.active}`);
    lines.push(`swipejob_queue_jobs{queue="${queue}",state="waiting"} ${s.waiting}`);
    lines.push(`swipejob_queue_jobs{queue="${queue}",state="failed"} ${s.failed}`);
    lines.push(`swipejob_queue_jobs{queue="${queue}",state="completed"} ${s.completed}`);
    lines.push(`swipejob_queue_jobs{queue="${queue}",state="delayed"} ${s.delayed}`);
  }

  return lines.join('\n') + '\n';
}
