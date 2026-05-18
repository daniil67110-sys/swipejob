import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { offers, profiles, users } from '@swipejob/db/schema';
import { computeEmbedding } from '../lib/embeddings.js';
import { isMistralConfigured } from '../lib/env.js';
import logger from '../lib/logger.js';

const OFFER_BATCH = 50;
const USER_BATCH = 50;

export type EmbeddingsResult =
  | { ok: true; offersEmbedded: number; usersEmbedded: number; durationMs: number }
  | { ok: true; mock: true }
  | { ok: false; error: string };

/**
 * Story 2.8 — calcule les embeddings manquants.
 *
 * Sans MISTRAL_API_KEY → mock (count=0).
 * Mistral rate limit ~25 req/s ; on batch séquentiel pour rester safe.
 *
 * Offre embed text = title + description (slice 4000 chars)
 * User profile embed text = "skills | education | bio | preferences"
 */
export async function processComputeEmbeddings(): Promise<EmbeddingsResult> {
  if (!isMistralConfigured) {
    logger.warn('Mistral not configured — compute-embeddings mock');
    return { ok: true, mock: true };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  const start = Date.now();
  try {
    // 1) Embedding offres
    const offerRows = await db
      .select({
        id: offers.id,
        title: offers.title,
        description: offers.description,
      })
      .from(offers)
      .where(and(eq(offers.status, 'active'), isNull(offers.embedding)))
      .limit(OFFER_BATCH);

    let offersEmbedded = 0;
    for (const o of offerRows) {
      const text = `${o.title}\n${o.description ?? ''}`;
      const res = await computeEmbedding(text);
      if (!res.ok) continue;
      await db.update(offers).set({ embedding: res.embedding }).where(eq(offers.id, o.id));
      offersEmbedded++;
    }

    // 2) Embedding users (profiles complets + emailVerified)
    const userRows = await db
      .select({
        id: users.id,
        firstName: profiles.firstName,
        headline: profiles.headline,
        summary: profiles.summary,
        skills: profiles.skills,
        educationLevel: profiles.educationLevel,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(isNotNull(users.emailVerified), isNull(users.profileEmbedding)))
      .limit(USER_BATCH);

    let usersEmbedded = 0;
    for (const u of userRows) {
      const skillsText = Array.isArray(u.skills) ? u.skills.join(', ') : '';
      const text = [
        u.headline ?? '',
        u.summary ?? '',
        `Compétences: ${skillsText}`,
        u.educationLevel ? `Niveau: ${u.educationLevel}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      if (text.length < 10) continue; // pas assez de signal
      const res = await computeEmbedding(text);
      if (!res.ok) continue;
      await db
        .update(users)
        .set({ profileEmbedding: res.embedding, embeddingComputedAt: new Date() })
        .where(eq(users.id, u.id));
      usersEmbedded++;
    }

    const durationMs = Date.now() - start;
    logger.info({ offersEmbedded, usersEmbedded, durationMs }, 'compute-embeddings batch complete');
    return { ok: true, offersEmbedded, usersEmbedded, durationMs };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'compute-embeddings failed');
    return { ok: false, error: errMessage };
  }
}
