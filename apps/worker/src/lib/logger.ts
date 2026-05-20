import pino from 'pino';
import { env, isObservabilityEnabled } from './env.js';

const REDACT_PATHS = [
  '*.email',
  '*.password',
  '*.cvText',
  '*.firstName',
  '*.lastName',
  'req.headers.authorization',
  'req.headers.cookie',
];

function buildTransport(): pino.LoggerOptions['transport'] | undefined {
  if (env.NODE_ENV === 'production' && isObservabilityEnabled.axiom) {
    return {
      target: '@axiomhq/pino',
      options: {
        dataset: env.AXIOM_DATASET_WORKER,
        token: env.AXIOM_TOKEN,
      },
    };
  }
  // En dev : pas de transport (pino-pretty utilise un worker thread qui hang
  // avec tsx --import sur certaines configs). Output direct JSON sync sur stdout.
  return undefined;
}

const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'worker',
    env: env.NODE_ENV,
  },
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  transport: buildTransport(),
});

export default logger;
