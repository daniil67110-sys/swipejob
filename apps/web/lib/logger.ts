/**
 * Logger client-side minimal — pour Server Components / Server Actions,
 * utiliser `@/lib/logger.server` (Pino + Axiom).
 *
 * Côté browser, on évite Pino (~50 KB minified) et on délègue à la console.
 */
const isDev = process.env['NODE_ENV'] === 'development';

const noop = (_message: unknown, ..._args: unknown[]) => {};

export const logger = {
  // eslint-disable-next-line no-console -- dev-only client logger, sémantique info/debug volontaire
  info: isDev ? console.info.bind(console) : noop,
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  // eslint-disable-next-line no-console -- dev-only client logger, sémantique info/debug volontaire
  debug: isDev ? console.debug.bind(console) : noop,
};
