import 'server-only';
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
        dataset: env.AXIOM_DATASET_WEB,
        token: env.AXIOM_TOKEN,
      },
    };
  }
  return undefined;
}

export const serverLogger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: {
    service: 'web',
    env: env.NODE_ENV,
  },
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  transport: buildTransport(),
});
