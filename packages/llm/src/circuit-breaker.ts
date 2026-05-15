/**
 * Circuit-breaker stub pour les appels LLM
 * Sera implémenté en Story 2.8 avec opossum ou cockatiel
 *
 * Utilise un Proxy pour détecter les accès au runtime et lever une erreur explicite.
 */

type CircuitBreakerInterface = {
  fire: <T>(fn: () => Promise<T>) => Promise<T>;
};

export const circuitBreaker: CircuitBreakerInterface = new Proxy({} as CircuitBreakerInterface, {
  get(_target, prop) {
    throw new Error(
      `@swipejob/llm: circuitBreaker not initialized — method "${String(prop)}" called before Story 2.8 implements the real circuit-breaker. Implement in Story 2.8.`,
    );
  },
});
