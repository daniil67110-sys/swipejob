/**
 * Audit log LLM — journalisation des appels IA
 * RGPD + conformité (architecture.md ligne 543)
 * Sera implémenté en Story 2.13
 */
export type LlmAuditEntry = {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  promptHash: string; // Hash du prompt (pas le texte brut)
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  success: boolean;
  userId?: string;
};

// Stub
export async function auditLlmCall(_entry: Omit<LlmAuditEntry, 'id' | 'timestamp'>): Promise<void> {
  // Sera implémenté en Story 2.13
}
