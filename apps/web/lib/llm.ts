/**
 * LLM client stub (Mistral / Anthropic)
 * Sera implémenté en Story 2.8 (TECH-004)
 */

export const LLM_CONFIG = {
  provider: 'mistral' as const,
  fallback: 'anthropic' as const,
};
