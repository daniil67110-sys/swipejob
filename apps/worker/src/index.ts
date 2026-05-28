import { initSentry, captureException, flushSentry } from './lib/sentry.js';
initSentry();

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import logger from './lib/logger.js';
import { env } from './lib/env.js';
import { startAuditWorker, stopAuditWorker } from './workers/audit.worker.js';
import { startOfferIngestWorker, stopOfferIngestWorker } from './workers/offer-ingest.worker.js';
import {
  startNormalizeOffersWorker,
  stopNormalizeOffersWorker,
} from './workers/normalize-offers.worker.js';
import { startOfferDedupeWorker, stopOfferDedupeWorker } from './workers/offer-dedupe.worker.js';
import {
  startOfferMaintenanceWorker,
  stopOfferMaintenanceWorker,
} from './workers/offer-maintenance.worker.js';
import {
  startEmbeddingsComputeWorker,
  stopEmbeddingsComputeWorker,
} from './workers/embeddings-compute.worker.js';
import { startMatchComputeWorker, stopMatchComputeWorker } from './workers/match-compute.worker.js';
import { startCvParseWorker, stopCvParseWorker } from './workers/cv-parse.worker.js';
import { startRgpdDeleteWorker, stopRgpdDeleteWorker } from './workers/rgpd-delete.worker.js';
import { startRgpdExportWorker, stopRgpdExportWorker } from './workers/rgpd-export.worker.js';
import {
  startRgpdAnonymizeInactiveWorker,
  stopRgpdAnonymizeInactiveWorker,
} from './workers/rgpd-anonymize-inactive.worker.js';
import {
  startRgpdAnonymizeManualWorker,
  stopRgpdAnonymizeManualWorker,
} from './workers/rgpd-anonymize-manual.worker.js';
import {
  startApplicationProcessWorker,
  stopApplicationProcessWorker,
} from './workers/application-process.worker.js';
import { startFailedJobsWorker, stopFailedJobsWorker } from './workers/failed-jobs.worker.js';
import {
  startNotificationsDigestWorker,
  stopNotificationsDigestWorker,
} from './workers/notifications-digest.worker.js';
import {
  startNotificationsPushWorker,
  stopNotificationsPushWorker,
} from './workers/notifications-push.worker.js';
import {
  startCoachInterviewPrepWorker,
  stopCoachInterviewPrepWorker,
} from './workers/coach-interview-prep.worker.js';
import {
  closeAllQueues,
  getAllQueueStats,
  initializeAllQueues,
  type QueueStats,
} from './queues/index.js';
import { closeRedis, isRedisHealthy } from './lib/redis.js';
import { buildMetricsResponse } from './http/metrics.js';

const app = new Hono();

// Liveness probe : le serveur HTTP répond, c'est tout. Pas d'appel Redis/queue
// pour rester sub-ms et éviter un faux negatif quand les queues sont en charge.
// /health reste la readiness probe (utile en monitoring/observability).
app.get('/alive', (c) => c.json({ status: 'ok' }, 200));

app.get('/health', async (c) => {
  const redisOk = await isRedisHealthy();
  const queues = await getAllQueueStats();
  const allQueuesUp = Object.values(queues).every((v): v is QueueStats => v !== null);
  const status = redisOk && allQueuesUp ? 'ok' : 'degraded';

  return c.json(
    {
      status,
      service: 'worker',
      version: process.env['APP_VERSION'] ?? 'dev',
      commit: env.RAILWAY_GIT_COMMIT_SHA ?? 'local',
      env: env.NODE_ENV,
      redis: redisOk ? 'connected' : 'disconnected',
      queues,
      timestamp: new Date().toISOString(),
    },
    status === 'ok' ? 200 : 503,
  );
});

app.get('/metrics', async (c) => {
  const body = await buildMetricsResponse();
  return c.text(body, 200, { 'content-type': 'text/plain; version=0.0.4' });
});

const PORT = env.WORKER_PORT;

let server: ReturnType<typeof serve> | undefined;

try {
  server = serve({ fetch: app.fetch, port: PORT }, (info) => {
    logger.info({ port: info.port }, `SwipeJob Worker démarré sur le port ${info.port}`);
  });

  if (env.WORKER_ROLE !== 'http-only') {
    const initialized = initializeAllQueues();
    logger.info({ initialized }, 'Queues initialized');

    void Promise.all([
      startAuditWorker(),
      startOfferIngestWorker(),
      startNormalizeOffersWorker(),
      startOfferDedupeWorker(),
      startOfferMaintenanceWorker(),
      startEmbeddingsComputeWorker(),
      startMatchComputeWorker(),
      startCvParseWorker(),
      startRgpdDeleteWorker(),
      startRgpdExportWorker(),
      startRgpdAnonymizeInactiveWorker(),
      startRgpdAnonymizeManualWorker(),
      startApplicationProcessWorker(),
      startNotificationsDigestWorker(),
      startNotificationsPushWorker(),
      startCoachInterviewPrepWorker(),
      startFailedJobsWorker(),
    ]).catch((err) => {
      logger.error({ err }, 'Failed to start one or more workers');
    });
  }
} catch (error: unknown) {
  const err = error as NodeJS.ErrnoException;
  if (err.code === 'EADDRINUSE') {
    logger.error(
      { port: PORT },
      `Port ${PORT} déjà utilisé. Vérifiez qu'aucun autre processus n'écoute sur ce port.`,
    );
  } else {
    logger.error({ error: err }, 'Erreur au démarrage du serveur worker');
  }
  captureException(err);
  await flushSentry();
  process.exit(1);
}

function shutdown(signal: string) {
  logger.info({ signal }, 'Signal reçu — arrêt gracieux du worker en cours...');
  void Promise.all([
    stopAuditWorker(),
    stopOfferIngestWorker(),
    stopNormalizeOffersWorker(),
    stopOfferDedupeWorker(),
    stopOfferMaintenanceWorker(),
    stopEmbeddingsComputeWorker(),
    stopMatchComputeWorker(),
    stopCvParseWorker(),
    stopRgpdDeleteWorker(),
    stopRgpdExportWorker(),
    stopRgpdAnonymizeInactiveWorker(),
    stopRgpdAnonymizeManualWorker(),
    stopApplicationProcessWorker(),
    stopNotificationsDigestWorker(),
    stopNotificationsPushWorker(),
    stopCoachInterviewPrepWorker(),
    stopFailedJobsWorker(),
    closeAllQueues(),
    closeRedis(),
  ]).catch(() => {});
  if (server) {
    server.close(() => {
      logger.info('Serveur fermé proprement.');
      void flushSentry().finally(() => process.exit(0));
    });
    setTimeout(() => {
      logger.error('Timeout arrêt gracieux — forçage exit.');
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'uncaughtException — arrêt du worker');
  captureException(error);
  void flushSentry().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandledRejection — arrêt du worker');
  captureException(reason);
  void flushSentry().finally(() => process.exit(1));
});

export { app };
