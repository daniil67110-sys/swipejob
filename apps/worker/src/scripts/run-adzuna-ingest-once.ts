import logger from '../lib/logger.js';
import { processIngestAdzuna } from '../jobs/ingest-adzuna.job.js';

(async () => {
  const start = Date.now();
  logger.warn('Lancement ingestion Adzuna (one-shot)');
  const result = await processIngestAdzuna();
  logger.warn({ result, durationMs: Date.now() - start }, 'Ingestion Adzuna terminée');
  process.exit(0);
})();
