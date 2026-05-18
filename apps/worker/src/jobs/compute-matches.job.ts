import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { iaAuditLogs, matchScores, preferences, profiles, users } from '@swipejob/db/schema';
import {
  ALLOWED_FEATURES,
  buildExplanation,
  compositeScore,
  computeEducationFit,
  computePrefFit,
  type UserPrefsForMatch,
} from '../lib/match-score.js';
import { env } from '../lib/env.js';
import logger from '../lib/logger.js';

const TOP_CANDIDATES = 200;
const TOP_SCORES = 50;
const USER_BATCH = 100;

export type ComputeMatchesResult =
  | {
      ok: true;
      usersProcessed: number;
      matchesWritten: number;
      durationMs: number;
      killSwitched?: false;
    }
  | { ok: true; killSwitched: true }
  | { ok: false; error: string };

/**
 * Story 2.8 — compute-matches.
 *
 * Pour chaque user avec profile_embedding :
 *  1. Top-200 offres par cosine similarity (pgvector `<=>` cosine distance, plus petit = plus proche)
 *  2. Compute composite (60% cosine + 25% pref + 15% edu) en JS
 *  3. Top-50 → upsert match_scores
 *  4. 1 row ia_audit_logs par user (Story 2.13)
 *
 * Kill switch IA_MATCHING_ENABLED=false (Story 2.9 NFR-F5) → bypass + log.
 */
export async function processComputeMatches(): Promise<ComputeMatchesResult> {
  if (!env.IA_MATCHING_ENABLED) {
    logger.warn('IA_MATCHING_ENABLED=false — compute-matches bypass');
    return { ok: true, killSwitched: true };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  const start = Date.now();
  try {
    // Users avec embedding calculé + non-deleted + emailVerified + consent GRANTED
    const userRows = await db
      .select({
        id: users.id,
        profileEmbedding: users.profileEmbedding,
        educationLevel: profiles.educationLevel,
        contractTypes: preferences.contractTypes,
        cities: preferences.cities,
        workModes: preferences.workModes,
        salaryMinMonthly: preferences.salaryMinMonthly,
        salaryMaxMonthly: preferences.salaryMaxMonthly,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .innerJoin(preferences, eq(preferences.userId, users.id))
      .where(
        and(
          isNotNull(users.profileEmbedding),
          isNotNull(users.emailVerified),
          isNull(users.deletedAt),
          eq(users.consentStatus, 'GRANTED'),
        ),
      )
      .limit(USER_BATCH);

    let usersProcessed = 0;
    let matchesWritten = 0;

    for (const u of userRows) {
      if (!u.profileEmbedding) continue;

      const userStart = Date.now();
      const embeddingLiteral = `[${u.profileEmbedding.join(',')}]`;

      // ANN search top-200 par cosine distance (`<=>` pgvector).
      type Candidate = {
        id: string;
        contract_type: string | null;
        location_city: string | null;
        remote_mode: string | null;
        salary_min_monthly: number | null;
        salary_max_monthly: number | null;
        requirements: { educationLevels?: string[] } | null;
        cosine_distance: number;
      };
      const candidates = (await db.execute(sql`
        SELECT id, contract_type, location_city, remote_mode,
               salary_min_monthly, salary_max_monthly, requirements,
               embedding <=> ${embeddingLiteral}::vector AS cosine_distance
        FROM offers
        WHERE status = 'active'
          AND canonical_id IS NULL
          AND quality_score >= 0.6
          AND embedding IS NOT NULL
        ORDER BY cosine_distance ASC
        LIMIT ${TOP_CANDIDATES}
      `)) as unknown as Candidate[];

      const userPrefs: UserPrefsForMatch = {
        contractTypes: u.contractTypes ?? [],
        cities: u.cities ?? [],
        workModes: u.workModes ?? [],
        salaryMinMonthly: u.salaryMinMonthly,
        salaryMaxMonthly: u.salaryMaxMonthly,
      };

      // Score composite + collect top-50
      const scored: Array<{ offerId: string; score: number; explanation: unknown }> = [];
      for (const c of candidates) {
        const cosineSim = 1 - c.cosine_distance; // distance → similarity
        const prefFit = computePrefFit(userPrefs, {
          id: c.id,
          contractType: c.contract_type,
          locationCity: c.location_city,
          remoteMode: c.remote_mode,
          salaryMinMonthly: c.salary_min_monthly,
          salaryMaxMonthly: c.salary_max_monthly,
        });
        const eduFit = computeEducationFit(u.educationLevel, c.requirements?.educationLevels);
        const score = compositeScore(cosineSim, prefFit, eduFit);
        const explanation = {
          contributingFactors: buildExplanation({
            cosineSim,
            prefs: userPrefs,
            offer: {
              id: c.id,
              contractType: c.contract_type,
              locationCity: c.location_city,
              remoteMode: c.remote_mode,
              salaryMinMonthly: c.salary_min_monthly,
              salaryMaxMonthly: c.salary_max_monthly,
            },
            userEducationLevel: u.educationLevel,
            offerEducationLevels: c.requirements?.educationLevels ?? null,
          }),
          modelVersion: 'v1-mistral-embed',
        };
        scored.push({ offerId: c.id, score, explanation });
      }

      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, TOP_SCORES);

      // Upsert match_scores
      for (const m of top) {
        await db
          .insert(matchScores)
          .values({
            userId: u.id,
            offerId: m.offerId,
            score: m.score,
            explanation: m.explanation as never,
          })
          .onConflictDoUpdate({
            target: [matchScores.userId, matchScores.offerId],
            set: {
              score: m.score,
              explanation: m.explanation as never,
              computedAt: new Date(),
            },
          });
      }
      matchesWritten += top.length;

      // 1 row ia_audit_logs par batch user (Story 2.13)
      const latencyMs = Date.now() - userStart;
      const promptHash = createHash('sha256')
        .update(`match-compute:${u.id}:${candidates.length}`)
        .digest('hex');
      await db.insert(iaAuditLogs).values({
        userId: u.id,
        model: env.MISTRAL_EMBED_MODEL,
        provider: 'mistral',
        promptHash,
        featureType: 'match_compute',
        latencyMs,
        success: true,
        tokensInput: null,
        tokensOutput: null,
        metadata: {
          candidatesScanned: candidates.length,
          matchesWritten: top.length,
          featuresUsed: [...ALLOWED_FEATURES],
          modelVersion: 'v1',
        },
      });

      usersProcessed++;
    }

    const durationMs = Date.now() - start;
    logger.info({ usersProcessed, matchesWritten, durationMs }, 'compute-matches batch complete');
    return { ok: true, usersProcessed, matchesWritten, durationMs };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'compute-matches failed');
    return { ok: false, error: errMessage };
  }
}
