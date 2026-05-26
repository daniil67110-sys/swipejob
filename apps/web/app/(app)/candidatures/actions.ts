'use server';

import { and, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import {
  applicationEvents,
  applications,
  iaAuditLogs,
  interviewPreps,
  offers,
  preferences,
  profiles,
  users,
} from '@swipejob/db/schema';
import {
  generateCoverLetter,
  sanitizeLetter,
  type CoverLetterInput,
} from '@swipejob/llm/cover-letter';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { serverLogger as logger } from '@/lib/logger.server';
import { env } from '@/lib/env';
import { enqueueApplicationProcess } from '@/lib/queue';
import { checkAndUnlockBadges, type BadgeDef } from '@/lib/badges';
import { MANUAL_STATUSES, type ApplicationStatus, type ManualStatus } from './lib';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type DashboardApplication = {
  id: string;
  status: ApplicationStatus;
  sentAt: Date | null;
  interviewAt: Date | null;
  signedAt: Date | null;
  lastStatusAt: Date | null;
  createdAt: Date;
  offer: {
    id: string;
    title: string;
    companyName: string | null;
    locationCity: string | null;
    contractType: string | null;
    sourceUrl: string | null;
  };
  interviewPrep: {
    companySummary: string;
    probableQuestions: string[];
    matchingStrengths: string[];
  } | null;
};

const STATUS_VALUES = [
  'pending_letter',
  'letter_generated',
  'pending_review',
  'sent',
  'cancelled_by_user',
  'failed',
  'read',
  'replied',
  'interview_scheduled',
  'signed',
  'rejected',
] as const;

const listSchema = z.object({
  statuses: z.array(z.enum(STATUS_VALUES)).max(11).optional(),
  sort: z.enum(['sent_desc', 'sent_asc', 'last_activity_desc']).default('last_activity_desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).max(10_000).default(0),
});

export async function listApplicationsAction(rawInput?: {
  statuses?: ApplicationStatus[];
  sort?: 'sent_desc' | 'sent_asc' | 'last_activity_desc';
  limit?: number;
  offset?: number;
}): Promise<ActionResult<{ items: DashboardApplication[]; total: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: true, data: { items: [], total: 0 } };
  }

  const parsed = listSchema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Filtres invalides.' } };
  }
  const { statuses, sort, limit, offset } = parsed.data;
  const userId = session.user.id;

  const conditions: SQL[] = [eq(applications.userId, userId)];
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(applications.status, statuses));
  }
  const whereClause = conditions.length === 1 ? conditions[0]! : and(...conditions)!;

  const orderBy =
    sort === 'sent_asc'
      ? sql`${applications.sentAt} ASC NULLS LAST`
      : sort === 'sent_desc'
        ? sql`${applications.sentAt} DESC NULLS LAST`
        : sql`COALESCE(${applications.lastStatusAt}, ${applications.sentAt}, ${applications.createdAt}) DESC`;

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      sentAt: applications.sentAt,
      interviewAt: applications.interviewAt,
      signedAt: applications.signedAt,
      lastStatusAt: applications.lastStatusAt,
      createdAt: applications.createdAt,
      offerId: offers.id,
      offerTitle: offers.title,
      offerCompanyName: offers.companyName,
      offerLocationCity: offers.locationCity,
      offerContractType: offers.contractType,
      offerSourceUrl: offers.sourceUrl,
      prepCompanySummary: interviewPreps.companySummary,
      prepProbableQuestions: interviewPreps.probableQuestions,
      prepMatchingStrengths: interviewPreps.matchingStrengths,
    })
    .from(applications)
    .innerJoin(offers, eq(offers.id, applications.offerId))
    .leftJoin(interviewPreps, eq(interviewPreps.applicationId, applications.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const totalRows = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(applications)
    .where(whereClause);
  const total = totalRows[0]?.count ?? 0;

  const items: DashboardApplication[] = rows.map((r) => ({
    id: r.id,
    status: r.status as ApplicationStatus,
    sentAt: r.sentAt,
    interviewAt: r.interviewAt,
    signedAt: r.signedAt,
    lastStatusAt: r.lastStatusAt,
    createdAt: r.createdAt,
    offer: {
      id: r.offerId,
      title: r.offerTitle,
      companyName: r.offerCompanyName,
      locationCity: r.offerLocationCity,
      contractType: r.offerContractType,
      sourceUrl: r.offerSourceUrl,
    },
    interviewPrep: r.prepCompanySummary
      ? {
          companySummary: r.prepCompanySummary,
          probableQuestions: r.prepProbableQuestions ?? [],
          matchingStrengths: r.prepMatchingStrengths ?? [],
        }
      : null,
  }));

  return { ok: true, data: { items, total } };
}

const updateStatusSchema = z.object({
  applicationId: z.string().min(1).max(40),
  status: z.enum(MANUAL_STATUSES as unknown as [ManualStatus, ...ManualStatus[]]),
  interviewAt: z.string().datetime().optional(),
});

/**
 * Story 4.2 — modification manuelle du statut (badge dropdown).
 * Pour Story 4.3, on garde un endpoint dédié `reportSignatureAction` (avec champs métier).
 */
export async function updateApplicationStatusAction(rawInput: {
  applicationId: string;
  status: ManualStatus;
  interviewAt?: string;
}): Promise<
  ActionResult<{ status: ManualStatus; lastStatusAt: Date; unlockedBadges?: BadgeDef[] }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }

  const parsed = updateStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }
  const userId = session.user.id;
  const { applicationId, status, interviewAt } = parsed.data;

  if (status === 'signed') {
    return {
      ok: false,
      error: {
        code: 'USE_SIGNATURE_ACTION',
        message: 'Utilise le bouton « Reporter ma signature ».',
      },
    };
  }

  const appRows = await db
    .select({ id: applications.id, status: applications.status })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);
  const app = appRows[0];
  if (!app) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } };
  }
  if (
    app.status === 'pending_letter' ||
    app.status === 'letter_generated' ||
    app.status === 'pending_review' ||
    app.status === 'cancelled_by_user' ||
    app.status === 'failed'
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: 'Cette candidature n’a pas encore été envoyée.',
      },
    };
  }

  const now = new Date();
  let parsedInterview: Date | null = null;
  if (status === 'interview_scheduled') {
    if (!interviewAt) {
      return {
        ok: false,
        error: { code: 'MISSING_INTERVIEW_AT', message: 'Renseigne la date de l’entretien.' },
      };
    }
    parsedInterview = new Date(interviewAt);
    if (
      Number.isNaN(parsedInterview.getTime()) ||
      parsedInterview < new Date(now.getTime() - 60_000)
    ) {
      return {
        ok: false,
        error: { code: 'INVALID_INTERVIEW_AT', message: 'Date d’entretien invalide.' },
      };
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({
        status,
        lastStatusAt: now,
        statusSource: 'manual',
        ...(parsedInterview ? { interviewAt: parsedInterview } : {}),
        updatedAt: now,
      })
      .where(eq(applications.id, applicationId));
    await tx.insert(applicationEvents).values({
      applicationId,
      event: status,
      metadata: JSON.stringify({ source: 'manual' }),
    });
  });

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'application.status_updated',
    targetType: 'application',
    targetId: applicationId,
    metadata: { from: app.status, to: status },
  });

  captureServer('application.status_manually_updated', hashUserId(userId), {
    from: app.status,
    to: status,
  });

  const unlockedBadges = await checkAndUnlockBadges(userId);
  return { ok: true, data: { status, lastStatusAt: now, unlockedBadges } };
}

const reportSignatureSchema = z.object({
  applicationId: z.string().min(1).max(40),
  salaryAnnualCents: z.number().int().min(0).max(1_000_000_00).optional(),
});

/**
 * Story 4.3 — reporter une signature avec célébration.
 * Snapshot company/title pour l'écran Wrapped (Story 5.5).
 */
export async function reportSignatureAction(rawInput: {
  applicationId: string;
  salaryAnnualCents?: number;
}): Promise<ActionResult<{ applicationId: string; signedAt: Date; unlockedBadges?: BadgeDef[] }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }

  const parsed = reportSignatureSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }
  const userId = session.user.id;
  const { applicationId, salaryAnnualCents } = parsed.data;

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      offerTitle: offers.title,
      offerCompany: offers.companyName,
    })
    .from(applications)
    .innerJoin(offers, eq(offers.id, applications.offerId))
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);
  const app = rows[0];
  if (!app) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } };
  }
  if (app.status === 'signed') {
    return {
      ok: false,
      error: { code: 'ALREADY_SIGNED', message: 'Signature déjà enregistrée.' },
    };
  }
  if (app.status === 'cancelled_by_user' || app.status === 'failed') {
    return {
      ok: false,
      error: { code: 'INVALID_TRANSITION', message: 'Candidature inactive.' },
    };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({
        status: 'signed',
        signedAt: now,
        lastStatusAt: now,
        statusSource: 'manual',
        signedSalaryAnnualCents: salaryAnnualCents ?? null,
        signedCompanySnapshot: app.offerCompany,
        signedJobTitleSnapshot: app.offerTitle,
        updatedAt: now,
      })
      .where(eq(applications.id, applicationId));
    await tx.insert(applicationEvents).values({
      applicationId,
      event: 'signed',
      metadata: JSON.stringify({ source: 'manual', hasSalary: salaryAnnualCents != null }),
    });
  });

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'application.signed',
    targetType: 'application',
    targetId: applicationId,
    metadata: { previousStatus: app.status },
  });

  captureServer('signature.reported', hashUserId(userId), {
    previous_status: app.status,
    has_salary: salaryAnnualCents != null,
  });

  logger.info({ applicationId, userId }, '🎉 signature reported');

  const unlockedBadges = await checkAndUnlockBadges(userId);
  return { ok: true, data: { applicationId, signedAt: now, unlockedBadges } };
}

// ============================================================================
// Story 3.7 — preview / édition / envoi de la lettre avant envoi
// ============================================================================

export type PendingReviewApplication = {
  id: string;
  coverLetterText: string;
  coverLetterStatus: 'generated' | 'template_fallback' | 'edited' | null;
  createdAt: Date;
  offer: {
    id: string;
    title: string;
    companyName: string | null;
    locationCity: string | null;
    contractType: string | null;
    contactEmail: string | null;
  };
};

/**
 * Liste les candidatures en attente de revue (Story 3.7).
 * Triées par date de création desc — plus récentes d'abord.
 */
export async function listPendingReviewAction(): Promise<
  ActionResult<{ items: PendingReviewApplication[] }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: true, data: { items: [] } };
  }
  const userId = session.user.id;

  const rows = await db
    .select({
      id: applications.id,
      coverLetterText: applications.coverLetterText,
      coverLetterStatus: applications.coverLetterStatus,
      createdAt: applications.createdAt,
      offerId: offers.id,
      offerTitle: offers.title,
      offerCompanyName: offers.companyName,
      offerLocationCity: offers.locationCity,
      offerContractType: offers.contractType,
      offerContactEmail: offers.contactEmail,
    })
    .from(applications)
    .innerJoin(offers, eq(offers.id, applications.offerId))
    .where(and(eq(applications.userId, userId), eq(applications.status, 'pending_review')))
    .orderBy(sql`${applications.createdAt} DESC`);

  const items: PendingReviewApplication[] = rows
    .filter((r) => r.coverLetterText)
    .map((r) => ({
      id: r.id,
      coverLetterText: r.coverLetterText!,
      coverLetterStatus: r.coverLetterStatus as PendingReviewApplication['coverLetterStatus'],
      createdAt: r.createdAt,
      offer: {
        id: r.offerId,
        title: r.offerTitle,
        companyName: r.offerCompanyName,
        locationCity: r.offerLocationCity,
        contractType: r.offerContractType,
        contactEmail: r.offerContactEmail,
      },
    }));

  return { ok: true, data: { items } };
}

const MAX_LETTER_CHARS = 8000;

const sendReviewSchema = z.object({
  applicationId: z.string().min(1).max(40),
  letterText: z.string().min(50).max(MAX_LETTER_CHARS),
});

/**
 * Story 3.7 — envoie la lettre éditée.
 * Update status='pending_letter' avec le texte final, puis enqueue le worker
 * avec `skipReview: true` pour qu'il envoie sans regen.
 */
export async function sendPendingReviewAction(rawInput: {
  applicationId: string;
  letterText: string;
}): Promise<ActionResult<{ applicationId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  const parsed = sendReviewSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La lettre doit faire entre 50 et 8000 caractères.',
      },
    };
  }
  const userId = session.user.id;
  const { applicationId, letterText } = parsed.data;
  const cleanText = sanitizeLetter(letterText);

  const appRows = await db
    .select({
      id: applications.id,
      status: applications.status,
      originalCoverLetterText: applications.coverLetterText,
      originalCoverLetterStatus: applications.coverLetterStatus,
    })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);
  const app = appRows[0];
  if (!app) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } };
  }
  if (app.status !== 'pending_review') {
    return {
      ok: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: 'Cette candidature n’est pas en attente de revue.',
      },
    };
  }

  const wasEdited = cleanText !== app.originalCoverLetterText;
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({
        status: 'pending_letter',
        coverLetterText: cleanText,
        coverLetterStatus: wasEdited ? 'edited' : app.originalCoverLetterStatus,
        updatedAt: now,
      })
      .where(eq(applications.id, applicationId));
    await tx.insert(applicationEvents).values({
      applicationId,
      event: 'review_validated',
      metadata: JSON.stringify({ edited: wasEdited }),
    });
  });

  const enqueued = await enqueueApplicationProcess({ applicationId, skipReview: true });
  if (!enqueued.ok) {
    logger.error({ applicationId, err: enqueued.error }, 'sendPendingReview enqueue failed');
  }

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'application.review_validated',
    targetType: 'application',
    targetId: applicationId,
    metadata: { edited: wasEdited },
  });

  captureServer('letter.review_validated', hashUserId(userId), { edited: wasEdited });

  return { ok: true, data: { applicationId } };
}

const regenerateSchema = z.object({
  applicationId: z.string().min(1).max(40),
});

/**
 * Story 3.7 — relance Mistral synchrone (depuis le drawer review).
 * Sauvegarde la nouvelle lettre dans l'app + audit log + retour client direct.
 */
export async function regenerateCoverLetterAction(rawInput: {
  applicationId: string;
}): Promise<ActionResult<{ letterText: string; status: 'generated' | 'template_fallback' }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  const parsed = regenerateSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }
  const userId = session.user.id;
  const { applicationId } = parsed.data;

  const rows = await db
    .select({
      appId: applications.id,
      appStatus: applications.status,
      userEmail: users.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      headline: profiles.headline,
      summary: profiles.summary,
      skills: profiles.skills,
      offerTitle: offers.title,
      offerCompany: offers.companyName,
      offerCity: offers.locationCity,
      offerDescription: offers.description,
    })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.userId))
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .innerJoin(offers, eq(offers.id, applications.offerId))
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);
  const app = rows[0];
  if (!app) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } };
  }
  if (app.appStatus !== 'pending_review') {
    return {
      ok: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: 'Régénération impossible à cette étape.',
      },
    };
  }

  const studentName = [app.firstName, app.lastName].filter(Boolean).join(' ') || app.userEmail;
  const input: CoverLetterInput = {
    studentName,
    studentSkills: Array.isArray(app.skills) ? app.skills : [],
    studentHeadline: app.headline,
    studentSummary: app.summary,
    jobTitle: app.offerTitle,
    companyName: app.offerCompany ?? 'l’entreprise',
    jobDescription: app.offerDescription,
    jobCity: app.offerCity,
  };

  let letterRes;
  try {
    letterRes = await generateCoverLetter(input, {
      mistralApiKey: env.MISTRAL_API_KEY ?? null,
      mistralModel: env.MISTRAL_MODEL,
      logger,
    });
  } catch (err) {
    logger.error({ err, applicationId }, 'regenerate cover letter threw');
    return {
      ok: false,
      error: { code: 'GENERATION_FAILED', message: 'Régénération impossible. Réessaie.' },
    };
  }

  await db
    .update(applications)
    .set({
      coverLetterText: letterRes.text,
      coverLetterStatus: letterRes.status,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));

  await db.insert(applicationEvents).values({
    applicationId,
    event: 'letter_regenerated',
    metadata: JSON.stringify({ status: letterRes.status, model: letterRes.meta.model }),
  });

  await db.insert(iaAuditLogs).values({
    userId,
    model: letterRes.meta.model,
    provider: letterRes.meta.provider,
    promptHash: letterRes.meta.promptHash,
    featureType: 'cover_letter',
    latencyMs: letterRes.meta.latencyMs,
    tokensInput: letterRes.meta.tokensInput,
    tokensOutput: letterRes.meta.tokensOutput,
    success: letterRes.meta.success,
    errorCode: letterRes.meta.success ? null : 'mistral_fallback',
    metadata: { applicationId, regenerated: true },
  });

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'application.letter_regenerated',
    targetType: 'application',
    targetId: applicationId,
    metadata: { status: letterRes.status },
  });

  captureServer('letter.regenerated', hashUserId(userId), { status: letterRes.status });

  return { ok: true, data: { letterText: letterRes.text, status: letterRes.status } };
}

const cancelReviewSchema = z.object({
  applicationId: z.string().min(1).max(40),
});

/**
 * Story 3.7 — annule la candidature depuis la fenêtre de revue.
 * Status='cancelled_by_user' pour que le user puisse re-swiper plus tard si besoin.
 */
export async function cancelPendingReviewAction(rawInput: {
  applicationId: string;
}): Promise<ActionResult<{ applicationId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  const parsed = cancelReviewSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }
  const userId = session.user.id;
  const { applicationId } = parsed.data;

  const appRows = await db
    .select({ id: applications.id, status: applications.status })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);
  const app = appRows[0];
  if (!app) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } };
  }
  if (app.status !== 'pending_review') {
    return {
      ok: false,
      error: { code: 'INVALID_TRANSITION', message: 'Annulation impossible à cette étape.' },
    };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({ status: 'cancelled_by_user', cancelledAt: now, updatedAt: now })
      .where(eq(applications.id, applicationId));
    await tx.insert(applicationEvents).values({
      applicationId,
      event: 'cancelled_from_review',
      metadata: null,
    });
  });

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'application.cancelled_from_review',
    targetType: 'application',
    targetId: applicationId,
  });
  captureServer('letter.review_cancelled', hashUserId(userId), {});

  return { ok: true, data: { applicationId } };
}

/**
 * Story 3.7 — toggle préférence reviewBeforeSend depuis le banner / le drawer.
 * Évite à l'utilisateur d'aller dans Paramètres juste pour désactiver le mode.
 */
export async function toggleReviewBeforeSendAction(input: {
  enabled: boolean;
}): Promise<ActionResult<{ enabled: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  if (!isDatabaseConfigured) {
    return { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } };
  }
  const enabled = Boolean(input?.enabled);
  const userId = session.user.id;

  const existing = await db
    .select({ id: preferences.id })
    .from(preferences)
    .where(eq(preferences.userId, userId))
    .limit(1);
  if (!existing[0]) {
    await db.insert(preferences).values({ userId, reviewBeforeSend: enabled });
  } else {
    await db
      .update(preferences)
      .set({ reviewBeforeSend: enabled, updatedAt: new Date() })
      .where(eq(preferences.userId, userId));
  }

  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'preferences.review_before_send_toggled',
    targetType: 'preferences',
    targetId: userId,
    metadata: { enabled },
  });
  captureServer('preferences.review_before_send_toggled', hashUserId(userId), { enabled });

  return { ok: true, data: { enabled } };
}
