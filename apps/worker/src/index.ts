import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { z } from 'zod';
import logger from './lib/logger.js';

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'worker',
    version: process.env['npm_package_version'] ?? '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint placeholder (Story 1.2 — observability)
// Returns 501 Not Implemented — Prometheus would parse 200 OK text as error
app.get('/metrics', (c) => c.text('# Not implemented\n', 501));

// Validate WORKER_PORT via Zod — avoids NaN from Number('abc') or Number('')
const portSchema = z.coerce.number().int().min(1).max(65535).default(4000);
const portResult = portSchema.safeParse(process.env['WORKER_PORT']);
const PORT = portResult.success ? portResult.data : 4000;

if (!portResult.success) {
  logger.warn(
    { envValue: process.env['WORKER_PORT'] },
    'Invalid WORKER_PORT — falling back to default port 4000',
  );
}

// Start server with EADDRINUSE error handling
let server: ReturnType<typeof serve> | undefined;

try {
  server = serve(
    {
      fetch: app.fetch,
      port: PORT,
    },
    (info) => {
      logger.info({ port: info.port }, `SwipeJob Worker démarré sur le port ${info.port}`);
    },
  );
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
  process.exit(1);
}

// Graceful shutdown handler
function shutdown(signal: string) {
  logger.info({ signal }, 'Signal reçu — arrêt gracieux du worker en cours...');
  if (server) {
    server.close(() => {
      logger.info('Serveur fermé proprement.');
      process.exit(0);
    });
    // Force exit after 10s if server doesn't close cleanly
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
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandledRejection — arrêt du worker');
  process.exit(1);
});

export { app };
