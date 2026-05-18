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
