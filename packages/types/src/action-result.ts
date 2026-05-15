/**
 * SwipeJob — ActionResult<T> type standard pour Server Actions
 * Source: architecture.md lignes 603-630 (Error Handling Patterns)
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };

/**
 * Helper pour créer un résultat de succès
 */
export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/**
 * Helper pour créer un résultat d'erreur
 */
export function err<T>(code: string, message: string, details?: unknown): ActionResult<T> {
  return { ok: false, error: { code, message, details } };
}
