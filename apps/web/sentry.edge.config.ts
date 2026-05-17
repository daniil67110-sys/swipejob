import * as Sentry from '@sentry/nextjs';

const dsn = process.env['SENTRY_DSN'];

type EdgeEvent = Parameters<NonNullable<Sentry.EdgeOptions['beforeSend']>>[0];

function scrubPII(event: EdgeEvent): EdgeEvent {
  if (event.request?.headers) {
    delete event.request.headers['cookie'];
    delete event.request.headers['authorization'];
  }
  if (event.request?.data && typeof event.request.data === 'object') {
    const data = event.request.data as Record<string, unknown>;
    if ('password' in data) data['password'] = '[REDACTED]';
    if ('email' in data) data['email'] = '[REDACTED]';
  }
  return event;
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env['VERCEL_ENV'] ?? process.env['NODE_ENV'] ?? 'development',
    release: process.env['VERCEL_GIT_COMMIT_SHA'] ?? 'local',
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      return scrubPII(event);
    },
  });
}
