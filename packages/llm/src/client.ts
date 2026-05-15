/**
 * SwipeJob — LLM Client (Mistral + Anthropic)
 * Sera implémenté en TECH-004 / Story 2.8
 * Support circuit-breaker et audit log
 *
 * Utilise un Proxy pour détecter les accès au runtime et lever une erreur explicite.
 */

export const LLM_PROVIDERS = {
  MISTRAL: 'mistral',
  ANTHROPIC: 'anthropic',
} as const;

export type LlmProvider = (typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS];

type LlmClientInterface = {
  complete: (prompt: string, provider?: LlmProvider) => Promise<string>;
  embed: (text: string) => Promise<number[]>;
};

// Proxy stub — sera implémenté avec le vrai circuit-breaker en Story 2.8
export const llmClient: LlmClientInterface = new Proxy({} as LlmClientInterface, {
  get(_target, prop) {
    throw new Error(
      `@swipejob/llm: client not initialized — method "${String(prop)}" called before Story 2.8 implements the real LLM client. Implement in Story 2.8.`,
    );
  },
});
