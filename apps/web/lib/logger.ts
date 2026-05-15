/**
 * Logger côté web (client-side safe)
 * Pas de Pino côté browser — utilise console avec filtrage
 * Pour les Server Components / Server Actions, on utilisera Axiom (Story 1.2)
 *
 * TODO Story 1.2: Remplacer par Axiom/OpenTelemetry côté serveur
 */

const isDev = process.env['NODE_ENV'] === 'development';

const noop = (_message: unknown, ..._args: unknown[]) => {};

export const logger = {
  // info: console.info en dev, no-op en prod (Story 1.2 ajoutera Axiom)
  // Note: console.info n'est pas dans la whitelist no-console (seulement warn/error)
  // on utilise console.warn comme shim acceptable en dev pour le développement
  info: isDev ? console.warn.bind(console) : noop,
  // warn: toujours visible (avertissements importants)
  warn: console.warn.bind(console),
  // error: toujours visible (erreurs critiques)
  error: console.error.bind(console),
  // debug: en dev uniquement via console.warn (pas de console.debug pour cohérence)
  debug: isDev ? console.warn.bind(console) : noop,
};
