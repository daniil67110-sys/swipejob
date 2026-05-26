import { desc, eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import {
  applicationEvents,
  applications,
  cvs,
  iaAuditLogs,
  offers,
  preferences,
  profiles,
  users,
} from '@swipejob/db/schema';
import { generateCoverLetter } from '../lib/cover-letter.js';
import { downloadCvFromR2 } from '../lib/r2-download.js';
import { sendApplicationEmail } from '../lib/resend-send.js';
import logger from '../lib/logger.js';

export type ProcessApplicationResult =
  | { ok: true; applicationId: string; finalStatus: string }
  | { ok: false; error: string };

export type ProcessApplicationOptions = {
  /**
   * Story 3.7 — relance le pipeline pour envoyer une lettre déjà éditée par l'user.
   * Skip la génération si coverLetterText existe + skip le gate reviewBeforeSend.
   */
  skipReview?: boolean;
};

/**
 * Job complet d'application (Stories 3.5 + 3.6 + 3.7).
 *
 * Lifecycle :
 *  1. Récup application + user + offer + cv + preferences
 *  2. Genère lettre via Mistral (fallback template), sauf si options.skipReview + texte déjà set
 *  3. UPDATE applications.coverLetterText + status
 *  4. Si preferences.reviewBeforeSend && !options.skipReview → status='pending_review', stop (Story 3.7)
 *  5. Sinon : download CV R2 + send email Resend
 *  6. UPDATE status='sent' + sentAt
 *  7. ia_audit_logs row (Story 3.5 NFR-F2) + application_events
 */
export async function processApplication(
  applicationId: string,
  options: ProcessApplicationOptions = {},
): Promise<ProcessApplicationResult> {
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }

  try {
    // 1. Fetch application + données associées
    const rows = await db
      .select({
        applicationId: applications.id,
        applicationStatus: applications.status,
        existingCoverLetterText: applications.coverLetterText,
        existingCoverLetterStatus: applications.coverLetterStatus,
        userId: users.id,
        userEmail: users.email,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        headline: profiles.headline,
        summary: profiles.summary,
        skills: profiles.skills,
        reviewBeforeSend: preferences.reviewBeforeSend,
        offerId: offers.id,
        offerTitle: offers.title,
        offerCompany: offers.companyName,
        offerCity: offers.locationCity,
        offerDescription: offers.description,
        offerContactEmail: offers.contactEmail,
      })
      .from(applications)
      .innerJoin(users, eq(users.id, applications.userId))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .innerJoin(offers, eq(offers.id, applications.offerId))
      .leftJoin(preferences, eq(preferences.userId, users.id))
      .where(eq(applications.id, applicationId))
      .limit(1);

    const app = rows[0];
    if (!app) return { ok: false, error: `application ${applicationId} not found` };
    if (app.applicationStatus !== 'pending_letter') {
      logger.warn(
        { applicationId, status: app.applicationStatus },
        'processApplication called on non-pending_letter app — skipping',
      );
      return { ok: true, applicationId, finalStatus: app.applicationStatus };
    }

    const studentName = [app.firstName, app.lastName].filter(Boolean).join(' ') || app.userEmail;

    // 2. Generate cover letter — sauf si l'app a déjà un texte (Story 3.7 send après review).
    let letterText: string;
    if (options.skipReview && app.existingCoverLetterText) {
      letterText = app.existingCoverLetterText;
      logger.info(
        { applicationId },
        'Skip regeneration — using user-edited cover letter (Story 3.7 send)',
      );
      await db
        .update(applications)
        .set({ status: 'letter_generated' })
        .where(eq(applications.id, applicationId));
    } else {
      const letterRes = await generateCoverLetter({
        studentName,
        studentSkills: Array.isArray(app.skills) ? app.skills : [],
        studentHeadline: app.headline,
        studentSummary: app.summary,
        jobTitle: app.offerTitle,
        companyName: app.offerCompany ?? 'l’entreprise',
        jobDescription: app.offerDescription,
        jobCity: app.offerCity,
      });
      letterText = letterRes.text;

      // 3. Update application + audit log
      const shouldReview = app.reviewBeforeSend && !options.skipReview;
      await db
        .update(applications)
        .set({
          coverLetterText: letterRes.text,
          coverLetterStatus: letterRes.status,
          status: shouldReview ? 'pending_review' : 'letter_generated',
        })
        .where(eq(applications.id, applicationId));

      await db.insert(applicationEvents).values({
        applicationId,
        event: 'letter_generated',
        metadata: JSON.stringify({ status: letterRes.status, model: letterRes.meta.model }),
      });

      await db.insert(iaAuditLogs).values({
        userId: app.userId,
        model: letterRes.meta.model,
        provider: letterRes.meta.provider,
        promptHash: letterRes.meta.promptHash,
        featureType: 'cover_letter',
        latencyMs: letterRes.meta.latencyMs,
        tokensInput: letterRes.meta.tokensInput,
        tokensOutput: letterRes.meta.tokensOutput,
        success: letterRes.meta.success,
        errorCode: letterRes.meta.success ? null : 'mistral_fallback',
        metadata: { applicationId, jobTitle: app.offerTitle, fallback: !letterRes.meta.success },
      });

      // 4. Si reviewBeforeSend && pas skipReview → stop (Story 3.7 — user va éditer + envoyer manuellement)
      if (shouldReview) {
        logger.info({ applicationId }, 'Application pending review (Story 3.7)');
        return { ok: true, applicationId, finalStatus: 'pending_review' };
      }
    }

    // 5. Pas de mail si contactEmail manquant (V1 limitation : Story 3.10b mieux V2)
    if (!app.offerContactEmail) {
      await db
        .update(applications)
        .set({ status: 'failed' })
        .where(eq(applications.id, applicationId));
      await db.insert(applicationEvents).values({
        applicationId,
        event: 'failed',
        metadata: JSON.stringify({ reason: 'no_contact_email' }),
      });
      return { ok: true, applicationId, finalStatus: 'failed' };
    }

    // 6. Download CV + send email
    let cvBuffer: Buffer | null = null;
    let cvFilename = `cv-${studentName.replace(/\s+/g, '-')}.pdf`;
    const cvRows = await db
      .select({ r2Key: cvs.r2Key, originalFilename: cvs.originalFilename })
      .from(cvs)
      .where(eq(cvs.userId, app.userId))
      .orderBy(desc(cvs.version))
      .limit(1);
    if (cvRows[0]) {
      cvBuffer = await downloadCvFromR2(cvRows[0].r2Key);
      cvFilename = cvRows[0].originalFilename || cvFilename;
    }

    const sendRes = await sendApplicationEmail({
      to: app.offerContactEmail,
      studentName,
      jobTitle: app.offerTitle,
      companyName: app.offerCompany ?? 'l’entreprise',
      letterText,
      cvBuffer,
      cvFilename,
    });

    if (!sendRes.ok) {
      await db
        .update(applications)
        .set({ status: 'failed' })
        .where(eq(applications.id, applicationId));
      await db.insert(applicationEvents).values({
        applicationId,
        event: 'failed',
        metadata: JSON.stringify({ reason: 'send_failed', error: sendRes.error }),
      });
      return { ok: false, error: `send failed: ${sendRes.error}` };
    }

    await db
      .update(applications)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(applications.id, applicationId));
    await db.insert(applicationEvents).values({
      applicationId,
      event: 'sent',
      metadata: JSON.stringify({
        emailId: 'mock' in sendRes && sendRes.mock ? null : sendRes.id,
        mock: 'mock' in sendRes ? sendRes.mock : false,
      }),
    });

    logger.info({ applicationId }, 'Application sent successfully');
    return { ok: true, applicationId, finalStatus: 'sent' };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage, applicationId }, 'processApplication failed');
    return { ok: false, error: errMessage };
  }
}
