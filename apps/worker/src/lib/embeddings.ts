import { env, isMistralConfigured } from './env.js';
import logger from './logger.js';

const MAX_RETRIES = 3;
const EMBED_DIM = 1024;

export type EmbedResult =
  | { ok: true; embedding: number[]; latencyMs: number; tokens: number | null }
  | { ok: false; error: string };

/**
 * Mistral-Embed (Story 2.8). Dim 1024 (vector(1024) DB).
 *
 * - Sans MISTRAL_API_KEY → return ok:false (caller fallback ou skip).
 * - Retry exp backoff 1s/2s/4s sur 429/5xx.
 * - Le texte est tronqué à 8000 chars (limite token Mistral-Embed).
 */
export async function computeEmbedding(text: string): Promise<EmbedResult> {
  if (!isMistralConfigured || !env.MISTRAL_API_KEY) {
    return { ok: false, error: 'MISTRAL_API_KEY missing' };
  }
  const truncated = text.slice(0, 8000);
  const start = Date.now();
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { Mistral } = await import('@mistralai/mistralai');
      const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });
      const res = await client.embeddings.create({
        model: env.MISTRAL_EMBED_MODEL,
        inputs: [truncated],
      });
      const embedding = res.data?.[0]?.embedding;
      if (!embedding || embedding.length !== EMBED_DIM) {
        throw new Error(
          `Unexpected embedding shape: got length ${embedding?.length}, expected ${EMBED_DIM}`,
        );
      }
      return {
        ok: true,
        embedding,
        latencyMs: Date.now() - start,
        tokens: res.usage?.totalTokens ?? null,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (attempt === MAX_RETRIES - 1) {
        logger.error({ errMessage: errMsg }, 'Mistral embed failed (exhausted)');
        return { ok: false, error: errMsg };
      }
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn({ attempt, delay, errMessage: errMsg }, 'Mistral embed retrying');
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return { ok: false, error: 'unreachable' };
}

/**
 * Cosine similarity 2 vectors. Utilisé en fallback JS (pgvector le fait en SQL).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
