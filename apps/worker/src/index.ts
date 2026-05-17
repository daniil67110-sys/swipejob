import { initSentry, captureException, flushSentry } from './lib/sentry.js';
initSentry();

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import logger from './lib/logger.js';
import { env } from './lib/env.js';
import { startAuditWorker, stopAuditWorker } from './workers/audit.worker.js';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'worker',
    version: process.env['APP_VERSION'] ?? 'dev',
    commit: env.RAILWAY_GIT_COMMIT_SHA ?? 'local',
    env: env.NODE_ENV,
    queues: { active: 0, waiting: 0 },
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', (c) => c.text('# Not implemented\n', 501));

const PORT = env.WORKER_PORT;

let server: ReturnType<typeof serve> | undefined;

try {
  server = serve({ fetch: app.fetch, port: PORT }, (info) => {
    logger.info({ port: info.port }, `SwipeJob Worker démarré sur le port ${info.port}`);
  });

  if (env.WORKER_ROLE !== 'http-only') {
    void startAuditWorker().catch((err) => {
      logger.error({ err }, 'Failed to start audit worker — continuing without it.');
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
  void stopAuditWorker().catch(() => {});
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
