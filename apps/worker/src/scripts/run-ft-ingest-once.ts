import logger from '../lib/logger.js';
import { processIngestFranceTravail } from '../jobs/ingest-france-travail.job.js';

(async () => {
  const start = Date.now();
  logger.warn('Lancement ingestion France Travail (one-shot)');
  const result = await processIngestFranceTravail();
  logger.warn({ result, durationMs: Date.now() - start }, 'Ingestion terminée');
  process.exit(0);
})();
