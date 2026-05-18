import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { serverLogger as logger } from './logger.server';

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    traceId?: string;
  };
};

export type RouteHandler<TArgs extends unknown[]> = (...args: TArgs) => Promise<Response>;

/**
 * Wrapper Route Handler : catch + log + Sentry capture + format réponse erreur cohérente.
 * Convention architecture.md ligne 604.
 *
 * Récupère le `x-trace-id` depuis la Request (set par middleware Story 1.2) pour
 * corrélation Sentry + Axiom. Génère un nouveau UUID seulement en fallback.
 *
 * Usage : `export const GET = withErrorHandler(async (req) => { ... })`.
 */
export function withErrorHandler<TArgs extends unknown[]>(
  handler: RouteHandler<TArgs>,
): RouteHandler<TArgs> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err) {
      // Tente d'extraire le traceId du premier argument (généralement Request).
      let traceId: string;
      const firstArg = args[0];
      if (
        firstArg &&
        typeof firstArg === 'object' &&
        'headers' in firstArg &&
        firstArg.headers instanceof Headers
      ) {
        traceId = firstArg.headers.get('x-trace-id') ?? crypto.randomUUID();
      } else {
        traceId = crypto.randomUUID();
      }

      logger.error({ err, traceId }, 'Unhandled Route Handler error');
      Sentry.captureException(err, { tags: { traceId } });

      const body: ApiError = {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Une erreur est survenue. Réessaie dans quelques instants.',
          traceId,
        },
      };
      return Response.json(body, { status: 500 });
    }
  };
}
