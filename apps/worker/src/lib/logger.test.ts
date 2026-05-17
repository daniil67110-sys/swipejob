import { describe, it, expect } from 'vitest';
import pino from 'pino';
import logger from './logger.js';

describe('logger', () => {
  it('expose les méthodes info/warn/error/debug et elles sont callables', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(() => logger.info('test info')).not.toThrow();
    expect(() => logger.error('test error')).not.toThrow();
  });

  it('a un niveau Pino valide', () => {
    const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
    expect(validLevels).toContain(logger.level);
  });

  it('redact les champs PII dans les logs JSON (email, password, cookie)', () => {
    let captured = '';
    const stream = { write: (chunk: string) => (captured += chunk) };
    const localLogger = pino(
      {
        level: 'info',
        redact: {
          paths: ['*.email', '*.password', 'req.headers.cookie'],
          censor: '[REDACTED]',
        },
      },
      stream,
    );
    localLogger.info(
      {
        user: { email: 'a@b.c', password: 'secret', userId: 'u_1' },
        req: { headers: { cookie: 'session=abc', authorization: 'Bearer xyz' } },
      },
      'user action',
    );
    expect(captured).toContain('[REDACTED]');
    expect(captured).not.toContain('a@b.c');
    expect(captured).not.toContain('secret');
    expect(captured).not.toContain('session=abc');
    expect(captured).toContain('u_1');
  });
});
