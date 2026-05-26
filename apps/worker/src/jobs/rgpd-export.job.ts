import { desc, eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { db, isDatabaseConfigured } from '@swipejob/db';
import {
  applications,
  cvs,
  preferences,
  profiles,
  referralCodes,
  referrals,
  rgpdExports,
  swipeEvents,
  userBadges,
  userConsents,
  users,
} from '@swipejob/db/schema';
import { buildExportKey, presignDownload, uploadRgpdExport } from '../lib/r2-rgpd.js';
import { sendRgpdExportReadyEmail } from '../lib/resend-send.js';
import logger from '../lib/logger.js';

export type RgpdExportResult =
  | { ok: true; jsonKey: string; pdfKey: string }
  | { ok: false; error: string };

/**
 * Story 6.3 — Job worker `rgpd-export`.
 *
 * 1. Collecte les données personnelles du user.
 * 2. Génère JSON structuré + PDF lisible.
 * 3. Upload sur R2 (préfixe `exports/<userId>/<exportId>/`).
 * 4. Calcule URLs signées 7j.
 * 5. Email avec liens de download.
 * 6. Marque la row rgpd_exports comme completed.
 */
export async function processRgpdExportJob(input: {
  userId: string;
  exportId: string;
}): Promise<RgpdExportResult> {
  if (!isDatabaseConfigured) {
    return { ok: false, error: 'DATABASE_URL absent' };
  }
  const { userId, exportId } = input;

  try {
    const data = await collectUserData(userId);
    if (!data) return { ok: false, error: `user ${userId} not found` };

    const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
    const pdfBuffer = await generatePdf(data);

    const jsonKey = buildExportKey(userId, exportId, 'donnees-personnelles.json');
    const pdfKey = buildExportKey(userId, exportId, 'donnees-personnelles.pdf');

    const jsonUpload = await uploadRgpdExport({
      key: jsonKey,
      body: jsonBuffer,
      contentType: 'application/json',
    });
    if (!jsonUpload.ok) return { ok: false, error: `JSON upload: ${jsonUpload.error}` };

    const pdfUpload = await uploadRgpdExport({
      key: pdfKey,
      body: pdfBuffer,
      contentType: 'application/pdf',
    });
    if (!pdfUpload.ok) return { ok: false, error: `PDF upload: ${pdfUpload.error}` };

    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await db
      .update(rgpdExports)
      .set({
        status: 'completed',
        jsonR2Key: jsonKey,
        pdfR2Key: pdfKey,
        completedAt: new Date(),
        expiresAt,
      })
      .where(eq(rgpdExports.id, exportId));

    const jsonUrl = await presignDownload(jsonKey);
    const pdfUrl = await presignDownload(pdfKey);

    if (data.user.email) {
      await sendRgpdExportReadyEmail({
        to: data.user.email,
        jsonUrl,
        pdfUrl,
        expiresAt,
      });
    }

    return { ok: true, jsonKey, pdfKey };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err: message, userId, exportId }, 'rgpd-export job failed');
    await db
      .update(rgpdExports)
      .set({ status: 'failed', errorMessage: message })
      .where(eq(rgpdExports.id, exportId));
    return { ok: false, error: message };
  }
}

type UserExportData = NonNullable<Awaited<ReturnType<typeof collectUserData>>>;

async function collectUserData(userId: string) {
  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      locale: users.locale,
      birthDate: users.birthDate,
      consentStatus: users.consentStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = userRows[0];
  if (!user) return null;

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const [pref] = await db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1);
  const cvRows = await db
    .select({
      version: cvs.version,
      originalFilename: cvs.originalFilename,
      uploadedAt: cvs.createdAt,
    })
    .from(cvs)
    .where(eq(cvs.userId, userId))
    .orderBy(desc(cvs.version));
  const appRows = await db
    .select({
      id: applications.id,
      status: applications.status,
      sentAt: applications.sentAt,
      interviewAt: applications.interviewAt,
      signedAt: applications.signedAt,
      signedCompanySnapshot: applications.signedCompanySnapshot,
      signedJobTitleSnapshot: applications.signedJobTitleSnapshot,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
  const swipes = await db
    .select({
      offerId: swipeEvents.offerId,
      direction: swipeEvents.direction,
      swipedAt: swipeEvents.swipedAt,
    })
    .from(swipeEvents)
    .where(eq(swipeEvents.userId, userId))
    .orderBy(desc(swipeEvents.swipedAt));
  const badges = await db
    .select({ badgeCode: userBadges.badgeCode, unlockedAt: userBadges.unlockedAt })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  const consents = await db
    .select({
      purpose: userConsents.purpose,
      granted: userConsents.granted,
      policyVersion: userConsents.policyVersion,
      createdAt: userConsents.createdAt,
    })
    .from(userConsents)
    .where(eq(userConsents.userId, userId))
    .orderBy(desc(userConsents.createdAt));
  const [refCode] = await db
    .select({ code: referralCodes.code, createdAt: referralCodes.createdAt })
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);
  const referralRows = await db
    .select({
      refereeUserId: referrals.refereeUserId,
      signupAt: referrals.signupAt,
      validatedAt: referrals.validatedAt,
    })
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      birthDate: user.birthDate,
      consentStatus: user.consentStatus,
      createdAt: user.createdAt.toISOString(),
    },
    profile: profile ?? null,
    preferences: pref ?? null,
    cvs: cvRows,
    applications: appRows,
    swipeEvents: swipes,
    badges,
    consents,
    referral: refCode ? { code: refCode.code, createdAt: refCode.createdAt.toISOString() } : null,
    referees: referralRows,
  };
}

async function generatePdf(data: UserExportData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(20).text('SwipeJob — Export RGPD');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(10).fillColor('#555');
    doc.text(
      `Conformément à l'article 20 du RGPD (droit à la portabilité), voici l'ensemble des données personnelles que SwipeJob détient à ton sujet.`,
    );
    doc.moveDown(0.4);
    doc.text(`Date d'export : ${new Date(data.exportedAt).toLocaleString('fr-FR')}`);
    doc.moveDown(1.5);

    section(doc, 'Identité');
    kv(doc, 'Email', data.user.email);
    kv(doc, 'Nom affiché', data.user.name);
    kv(doc, 'Langue', data.user.locale);
    kv(doc, 'Date de naissance', data.user.birthDate);
    kv(doc, 'Statut de consentement', data.user.consentStatus);
    kv(doc, 'Compte créé le', new Date(data.user.createdAt).toLocaleString('fr-FR'));

    if (data.profile) {
      section(doc, 'Profil');
      kv(doc, 'Prénom', data.profile.firstName);
      kv(doc, 'Nom', data.profile.lastName);
      kv(doc, 'Titre', data.profile.headline);
      kv(doc, 'Bio', data.profile.summary);
      kv(doc, 'Téléphone', data.profile.phone);
      kv(doc, 'Ville', data.profile.city);
      kv(doc, 'LinkedIn', data.profile.linkedinUrl);
      kv(doc, "Niveau d'études", data.profile.educationLevel);
      kv(doc, 'Compétences', (data.profile.skills ?? []).join(', '));
    }

    if (data.preferences) {
      section(doc, 'Préférences de recherche');
      kv(doc, 'Contrats', (data.preferences.contractTypes ?? []).join(', '));
      kv(doc, 'Villes', (data.preferences.cities ?? []).join(', '));
      kv(doc, 'Rayon (km)', data.preferences.geoRadiusKm);
      kv(doc, 'Mode de travail', (data.preferences.workModes ?? []).join(', '));
      kv(doc, 'Secteurs', (data.preferences.sectors ?? []).join(', '));
      kv(doc, 'Salaire min (€/mois)', data.preferences.salaryMinMonthly);
      kv(doc, 'Salaire max (€/mois)', data.preferences.salaryMaxMonthly);
    }

    section(doc, `Candidatures (${data.applications.length})`);
    for (const a of data.applications.slice(0, 30)) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#111')
        .text(
          `• ${a.signedJobTitleSnapshot ?? 'Poste'} — ${a.signedCompanySnapshot ?? 'Entreprise'} — statut ${a.status} — ${new Date(a.createdAt).toLocaleDateString('fr-FR')}`,
        );
    }
    if (data.applications.length > 30) {
      doc.fillColor('#555').text(`(… et ${data.applications.length - 30} autres dans le JSON)`);
    }

    section(doc, `Swipes (${data.swipeEvents.length})`);
    doc.font('Helvetica').fontSize(10).fillColor('#555');
    doc.text('Le détail offre-par-offre est dans le fichier JSON joint. Résumé par direction :');
    const byDirection = data.swipeEvents.reduce<Record<string, number>>((acc, s) => {
      acc[s.direction] = (acc[s.direction] ?? 0) + 1;
      return acc;
    }, {});
    doc
      .fillColor('#111')
      .text(
        `Droite (candidature) : ${byDirection.right ?? 0} · Gauche (passé) : ${byDirection.left ?? 0} · Haut (favoris) : ${byDirection.up ?? 0}`,
      );

    section(doc, `Badges (${data.badges.length})`);
    for (const b of data.badges) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#111')
        .text(
          `• ${b.badgeCode} — débloqué le ${new Date(b.unlockedAt).toLocaleDateString('fr-FR')}`,
        );
    }

    section(doc, `Historique des consentements (${data.consents.length})`);
    for (const c of data.consents) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#111')
        .text(
          `• ${c.purpose} — ${c.granted ? 'accordé' : 'refusé'} — politique v${c.policyVersion} — ${new Date(c.createdAt).toLocaleString('fr-FR')}`,
        );
    }

    if (data.referral) {
      section(doc, 'Parrainage');
      kv(doc, 'Mon code', data.referral.code);
      kv(doc, 'Filleuls inscrits', data.referees.length);
      kv(doc, 'Filleuls validés', data.referees.filter((r) => r.validatedAt !== null).length);
    }

    doc.moveDown(2);
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor('#888')
      .text(
        'Pour toute question concernant tes données, contacte dpo@swipejob.fr. Tu peux à tout moment demander la suppression complète depuis ton compte (RGPD art. 17).',
      );

    doc.end();
  });
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111').text(title);
  doc
    .moveTo(doc.x, doc.y + 4)
    .lineTo(doc.x + 495, doc.y + 4)
    .strokeColor('#ddd')
    .stroke();
  doc.moveDown(0.6);
}

function kv(doc: PDFKit.PDFDocument, key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return;
  const str = typeof value === 'string' ? value : String(value);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#444').text(`${key} : `, { continued: true });
  doc.font('Helvetica').fontSize(10).fillColor('#111').text(str);
}
