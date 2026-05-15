import pino from 'pino';

/**
 * SwipeJob Worker — Structured JSON logger (Pino)
 * Log level configurable via LOG_LEVEL env variable
 *
 * LOG_LEVEL whitelist: only valid Pino levels accepted, fallback to 'info'
 */

const VALID_LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];

function resolveLogLevel(): LogLevel {
  const envLevel = process.env['LOG_LEVEL'];
  if (envLevel && (VALID_LOG_LEVELS as readonly string[]).includes(envLevel)) {
    return envLevel as LogLevel;
  }
  if (envLevel) {
    console.warn(
      `[logger] Invalid LOG_LEVEL="${envLevel}". Valid values: ${VALID_LOG_LEVELS.join(', ')}. Falling back to "info".`,
    );
  }
  return 'info';
}

const logger = pino({
  level: resolveLogLevel(),
  ...(process.env['NODE_ENV'] !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});

export default logger;
