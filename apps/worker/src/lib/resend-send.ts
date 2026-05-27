import { Resend } from 'resend';
import { env, isResendConfigured } from './env.js';
import logger from './logger.js';

let cached: Resend | null = null;

function client(): Resend | null {
  if (!isResendConfigured || !env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export type SendApplicationInput = {
  to: string; // recruteur
  studentName: string;
  jobTitle: string;
  companyName: string;
  letterText: string;
  cvBuffer: Buffer | null;
  cvFilename: string;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: true; id: null; mock: true }
  | { ok: false; error: string };

/**
 * Story 3.6 — envoie la candidature par email Resend.
 *
 * Subject FR : "Candidature {studentName} — {jobTitle}"
 * Body HTML + text.
 * Attachment CV PDF (téléchargé R2 par le caller).
 *
 * Mode mock si RESEND_API_KEY absent.
 */
export async function sendApplicationEmail(input: SendApplicationInput): Promise<SendResult> {
  const c = client();
  const subject = `Candidature ${input.studentName} — ${input.jobTitle}`;
  if (!c) {
    logger.warn({ to: redact(input.to), subject }, 'Resend not configured — application send mock');
    return { ok: true, id: null, mock: true };
  }

  const html = buildHtml(input);
  const text = `${input.letterText}\n\nCV en pièce jointe.`;

  try {
    const res = await c.emails.send({
      from: env.RESEND_FROM,
      to: input.to,
      subject,
      html,
      text,
      attachments: input.cvBuffer
        ? [{ filename: input.cvFilename, content: input.cvBuffer }]
        : undefined,
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMessage }, 'Resend application send failed');
    return { ok: false, error: errMessage };
  }
}

function redact(email: string): string {
  return email.replace(/(.).+(@.+)/, '$1***$2');
}

function buildHtml(input: SendApplicationInput): string {
  const paragraphs = input.letterText
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  return `<!doctype html>
<html lang="fr">
  <body style="font-family:system-ui,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:18px;margin:0 0 16px">Candidature : ${escapeHtml(input.jobTitle)}</h1>
    ${paragraphs}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">CV en pièce jointe. Candidature transmise via SwipeJob.</p>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Story 6.3 — email RGPD : export prêt avec liens download signés 7j.
 */
export async function sendRgpdExportReadyEmail(input: {
  to: string;
  jsonUrl: string | null;
  pdfUrl: string | null;
  expiresAt: Date;
}): Promise<SendResult> {
  const c = client();
  const expires = input.expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const html = `<!doctype html>
<html lang="fr">
  <body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">Ton export de données est prêt</h1>
    <p>Bonjour,</p>
    <p>Conformément à l'article 20 du RGPD, voici l'export complet de tes données personnelles SwipeJob.</p>
    <p>Les liens ci-dessous sont valides jusqu'au <strong>${escapeHtml(expires)}</strong>.</p>
    <p style="margin:24px 0">
      ${input.pdfUrl ? `<a href="${input.pdfUrl}" style="display:inline-block;background:#4F5BFF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;margin-right:8px">Télécharger le PDF</a>` : ''}
      ${input.jsonUrl ? `<a href="${input.jsonUrl}" style="display:inline-block;background:#1FB87A;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Télécharger le JSON</a>` : ''}
    </p>
    <p style="color:#555;font-size:13px">Le PDF est lisible humain. Le JSON est structuré pour réutilisation (portabilité art. 20).</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">
      Si tu n'as pas demandé cet export, contacte <a href="mailto:dpo@swipejob.fr" style="color:#4F5BFF">dpo@swipejob.fr</a>.
    </p>
  </body>
</html>`;
  if (!c) {
    logger.warn({ to: redact(input.to) }, 'Resend non configuré — RGPD export email mock');
    return { ok: true, id: null, mock: true };
  }
  try {
    const res = await c.emails.send({
      from: env.RESEND_FROM,
      to: input.to,
      subject: 'SwipeJob — Ton export de données est prêt',
      html,
      text: `Ton export est prêt. PDF : ${input.pdfUrl ?? 'indisponible'} — JSON : ${input.jsonUrl ?? 'indisponible'} — valide jusqu'au ${expires}.`,
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, to: redact(input.to) }, 'RGPD export email failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

/**
 * Story 6.6 — email J-30 : prévient l'utilisateur que son compte va être
 * anonymisé pour cause d'inactivité prolongée. Une simple connexion à
 * SwipeJob suffit à annuler le processus.
 */
export async function sendInactivityWarningEmail(input: {
  to: string;
  firstName: string | null;
  lastActivityAt: Date;
  scheduledAnonymizationAt: Date;
  loginUrl: string;
}): Promise<SendResult> {
  const c = client();
  const greeting = input.firstName ? `Bonjour ${input.firstName},` : 'Bonjour,';
  const lastSeen = input.lastActivityAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const scheduledOn = input.scheduledAnonymizationAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const html = `<!doctype html>
<html lang="fr">
  <body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">Ton compte SwipeJob va être anonymisé</h1>
    <p>${escapeHtml(greeting)}</p>
    <p>Ta dernière connexion remonte au <strong>${escapeHtml(lastSeen)}</strong>.</p>
    <p>
      Conformément au RGPD (principe de proportionnalité de la conservation), nous
      anonymiserons tes données personnelles le <strong>${escapeHtml(scheduledOn)}</strong>.
    </p>
    <p>
      Concrètement : ton CV, ton profil, ton email et ta lettre de motivation seront
      supprimés. Tes statistiques anonymisées (nombre de candidatures, swipes) seront
      conservées pour notre analyse produit.
    </p>
    <p style="margin:24px 0">
      <a href="${input.loginUrl}" style="display:inline-block;background:#4F5BFF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">
        Me reconnecter à SwipeJob
      </a>
    </p>
    <p style="color:#555;font-size:13px">Une simple connexion suffit à annuler le processus.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">
      Pour exporter tes données avant cette date :
      <a href="mailto:dpo@swipejob.fr" style="color:#4F5BFF">dpo@swipejob.fr</a>.
    </p>
  </body>
</html>`;
  const text = `${greeting}\n\nTa dernière connexion remonte au ${lastSeen}. Conformément au RGPD, nous anonymiserons tes données le ${scheduledOn} sauf si tu te reconnectes avant : ${input.loginUrl}\n\nPour exporter avant : dpo@swipejob.fr`;
  if (!c) {
    logger.warn({ to: redact(input.to) }, 'Resend non configuré — inactivity warning mock');
    return { ok: true, id: null, mock: true };
  }
  try {
    const res = await c.emails.send({
      from: env.RESEND_FROM,
      to: input.to,
      subject: 'SwipeJob — Ton compte sera anonymisé dans 30 jours',
      html,
      text,
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, to: redact(input.to) }, 'Inactivity warning email failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

/**
 * Story 6.6 — email post-anonymisation : confirme à l'utilisateur que ses
 * données ont été anonymisées. Cet email part vers la dernière adresse connue
 * AVANT le clear pour la traçabilité.
 */
export async function sendAccountAnonymizedEmail(input: {
  to: string;
  firstName: string | null;
}): Promise<SendResult> {
  const c = client();
  const greeting = input.firstName ? `Bonjour ${input.firstName},` : 'Bonjour,';
  const html = `<!doctype html>
<html lang="fr">
  <body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">Ton compte SwipeJob a été anonymisé</h1>
    <p>${escapeHtml(greeting)}</p>
    <p>
      Comme annoncé il y a 30 jours, ton compte vient d'être anonymisé conformément
      au RGPD pour inactivité prolongée (≥ 24 mois).
    </p>
    <p>
      Ton profil, ton CV, ton email et toutes tes lettres de motivation ont été
      supprimés définitivement. Tu peux te réinscrire à tout moment si tu souhaites
      relancer ta recherche d'alternance ou de stage.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">
      Pour toute question RGPD :
      <a href="mailto:dpo@swipejob.fr" style="color:#4F5BFF">dpo@swipejob.fr</a>.
    </p>
  </body>
</html>`;
  const text = `${greeting}\n\nComme annoncé il y a 30 jours, ton compte SwipeJob a été anonymisé pour inactivité ≥ 24 mois (RGPD). Ton profil, CV et lettres ont été supprimés. Tu peux te réinscrire à tout moment.\n\nDPO : dpo@swipejob.fr`;
  if (!c) {
    logger.warn({ to: redact(input.to) }, 'Resend non configuré — anonymized email mock');
    return { ok: true, id: null, mock: true };
  }
  try {
    const res = await c.emails.send({
      from: env.RESEND_FROM,
      to: input.to,
      subject: 'SwipeJob — Ton compte a été anonymisé',
      html,
      text,
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, to: redact(input.to) }, 'Anonymized email failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
