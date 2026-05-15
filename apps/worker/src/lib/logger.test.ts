import { describe, it, expect } from 'vitest';
import logger from './logger.js';

/**
 * Smoke test — Vitest minimal pour valider que le logger est fonctionnel.
 * Teste la signature (méthodes exposées et callables) plutôt que la valeur de LOG_LEVEL.
 */
describe('logger', () => {
  it('should expose info method and be callable', () => {
    expect(typeof logger.info).toBe('function');
    // Doit être appelable sans throw
    expect(() => logger.info('test info')).not.toThrow();
  });

  it('should expose error method and be callable', () => {
    expect(typeof logger.error).toBe('function');
    expect(() => logger.error('test error')).not.toThrow();
  });

  it('should expose warn method and be callable', () => {
    expect(typeof logger.warn).toBe('function');
    expect(() => logger.warn('test warn')).not.toThrow();
  });

  it('should expose debug method and be callable', () => {
    expect(typeof logger.debug).toBe('function');
    expect(() => logger.debug('test debug')).not.toThrow();
  });

  it('should have a valid Pino log level set', () => {
    const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
    // Test que le niveau actuel est dans la whitelist (après résolution par resolveLogLevel)
    expect(validLevels).toContain(logger.level);
    // Le niveau NE DOIT PAS être une valeur invalide (ex: "verbose")
    expect(logger.level).not.toBe('verbose');
  });
});
