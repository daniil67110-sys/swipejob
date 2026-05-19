import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import {
  applications,
  iaAuditLogs,
  interviewPreps,
  matchScores,
  notificationEvents,
  offers,
  profiles,
} from '@swipejob/db/schema';
import { generateInterviewPrep } from '../lib/interview-prep.js';
import { env } from '../lib/env.js';
import logger from '../lib/logger.js';

export type CoachPrepResult = {
  ok: true;
  scanned: number;
  generated: number;
  skipped: number;
  failed: number;
};

const LOOKAHEAD_HOURS = 30; // génère 24-30h avant entretien
const LOOKAHEAD_MIN = 22;
const MAX_PER_RUN = 500;

/**
 * Story 4.7 — Coach IA pré-entretien.
 * Cron horaire scanne les entretiens à venir dans la fenêtre [22h, 30h].
 * Idempotent via interview_preps.application_id unique.
 */
export async function processInterviewPrepBatch(): Promise<CoachPrepResult> {
  if (!isDatabaseConfigured) {
    return { ok: true, scanned: 0, generated: 0, skipped: 0, failed: 0 };
  }
  if (!env.NOTIFICATIONS_ENABLED) {
    logger.warn('NOTIFICATIONS_ENABLED=false — kill switch active, coach prep aborted');
    return { ok: true, scanned: 0, generated: 0, skipped: 0, failed: 0 };
  }

  const now = new Date();
  const minTs = new Date(now.getTime() + LOOKAHEAD_MIN * 3_600_000);
  const maxTs = new Date(now.getTime() + LOOKAHEAD_HOURS * 3_600_000);

  const rows = await db
    .select({
      applicationId: applications.id,
      userId: applications.userId,
      interviewAt: applications.interviewAt,
      offerId: offers.id,
      offerTitle: offers.title,
      offerCompany: offers.companyName,
      offerCity: offers.locationCity,
      offerDescription: offers.description,
      profileFirstName: profiles.firstName,
      profileLastName: profiles.lastName,
      profileHeadline: profiles.headline,
      profileSummary: profiles.summary,
      skills: profiles.skills,
    })
    .from(applications)
    .innerJoin(offers, eq(offers.id, applications.offerId))
    .leftJoin(profiles, eq(profiles.userId, applications.userId))
    .where(
      and(
        eq(applications.status, 'interview_scheduled'),
        sql`${applications.interviewAt} IS NOT NULL`,
        gte(applications.interviewAt, minTs),
        lt(applications.interviewAt, maxTs),
        sql`NOT EXISTS (
          SELECT 1 FROM interview_preps ip WHERE ip.application_id = ${applications.id}
        )`,
      ),
    )
    .limit(MAX_PER_RUN);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      // Features matching (audit list) — match_scores.explanation jsonb { contributingFactors: [...] }
      const ms = await db
        .select({ explanation: matchScores.explanation })
        .from(matchScores)
        .where(and(eq(matchScores.userId, row.userId), eq(matchScores.offerId, row.offerId)))
        .limit(1);
      const matchFeatures = extractFactorNames(ms[0]?.explanation ?? null);

      const prep = await generateInterviewPrep({
        studentName:
          [row.profileFirstName, row.profileLastName].filter(Boolean).join(' ') || 'Étudiant',
        studentSkills: row.skills ?? [],
        studentHeadline: row.profileHeadline,
        studentSummary: row.profileSummary,
        jobTitle: row.offerTitle,
        companyName: row.offerCompany ?? 'Entreprise',
        jobDescription: row.offerDescription,
        jobCity: row.offerCity,
        matchFeatures,
      });

      // Insert idempotent via unique(application_id)
      const inserted = await db
        .insert(interviewPreps)
        .values({
          applicationId: row.applicationId,
          companySummary: prep.companySummary,
          probableQuestions: prep.probableQuestions,
          matchingStrengths: prep.matchingStrengths,
          model: prep.meta.model,
        })
        .onConflictDoNothing({ target: interviewPreps.applicationId })
        .returning({ id: interviewPreps.id });

      if (inserted.length === 0) {
        skipped++;
        continue;
      }

      // Audit IA (NFR-F2)
      await db.insert(iaAuditLogs).values({
        userId: row.userId,
        featureType: 'interview_prep',
        model: prep.meta.model,
        provider: prep.meta.provider,
        promptHash: prep.meta.promptHash,
        latencyMs: prep.meta.latencyMs,
        success: prep.meta.success,
        metadata: { applicationId: row.applicationId },
      });

      await db.insert(notificationEvents).values({
        userId: row.userId,
        channel: 'coach',
        eventType: 'generated',
        referenceKey: `coach:${row.applicationId}`,
        metadata: JSON.stringify({ provider: prep.meta.provider }),
      });

      generated++;
    } catch (err) {
      failed++;
      logger.warn(
        { applicationId: row.applicationId, err: err instanceof Error ? err.message : String(err) },
        'interview prep generation failed',
      );
    }
  }

  logger.info({ scanned: rows.length, generated, skipped, failed }, 'coach prep batch done');
  return { ok: true, scanned: rows.length, generated, skipped, failed };
}

function extractFactorNames(
  explanation: { contributingFactors?: Array<{ factor?: string }> } | null,
): string[] {
  if (!explanation?.contributingFactors) return [];
  return explanation.contributingFactors
    .map((f) => (typeof f.factor === 'string' ? f.factor : ''))
    .filter(Boolean);
}
