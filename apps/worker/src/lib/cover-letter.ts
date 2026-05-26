import { generateCoverLetter as generateShared } from '@swipejob/llm/cover-letter';
import type { CoverLetterInput, CoverLetterResult } from '@swipejob/llm/cover-letter';
import { env } from './env.js';
import logger from './logger.js';

export type { CoverLetterInput, CoverLetterResult };

/**
 * Story 3.5 — wrapper côté worker : injecte la config Mistral via env.
 * La logique pure vit dans @swipejob/llm/cover-letter (partagée avec apps/web Story 3.7).
 */
export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterResult> {
  return generateShared(input, {
    mistralApiKey: env.MISTRAL_API_KEY ?? null,
    mistralModel: env.MISTRAL_MODEL,
    logger,
  });
}
