import 'server-only';
import { Resend } from 'resend';
import { env, isEmailConfigured } from './env';
import { serverLogger as logger } from './logger.server';

export type SendVerificationEmailInput = {
  to: string;
  verificationUrl: string;
  locale?: 'fr-FR';
};

export type SendEmailResult =
  | { ok: true; id: string; mock?: false }
  | { ok: true; id: null; mock: true }
  | { ok: false; error: string };

let cachedClient: Resend | null = null;
function getClient(): Resend | null {
  if (!isEmailConfigured || !env.RESEND_API_KEY) return null;
  if (!cachedClient) cachedClient = new Resend(env.RESEND_API_KEY);
  return cachedClient;
}

export function buildVerificationEmailHtml(verificationUrl: string): string {
  return `<!doctype html>
<html lang="fr">
  <body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">SwipeJob — valide ton email</h1>
    <p>Bonjour,</p>
    <p>Clique sur le bouton ci-dessous pour valider ton email et accéder à SwipeJob. Le lien est valide pendant 24h.</p>
    <p style="margin:24px 0">
      <a href="${verificationUrl}"
         style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">
        Valider mon email
      </a>
    </p>
    <p style="color:#555;font-size:13px">Si le bouton ne marche pas, copie-colle ce lien dans ton navigateur :<br><span style="word-break:break-all">${verificationUrl}</span></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">
      Si tu n'as pas demandé cette inscription, ignore ce message — aucun compte n'a été créé.<br>
      <a href="https://swipejob.fr/politique-confidentialite" style="color:#2563eb">Politique de confidentialité</a>
      · <a href="https://swipejob.fr/cgu" style="color:#2563eb">CGU</a>
    </p>
  </body>
</html>`;
}

function buildVerificationEmailText(verificationUrl: string): string {
  return [
    'SwipeJob — valide ton email',
    '',
    'Bonjour,',
    'Clique sur ce lien pour valider ton email (valide 24h) :',
    verificationUrl,
    '',
    "Si tu n'as pas demandé cette inscription, ignore ce message.",
  ].join('\n');
}

export async function sendVerificationEmail(
  input: SendVerificationEmailInput,
): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) {
    logger.warn(
      { to: input.to, verificationUrl: input.verificationUrl },
      'Resend non configuré — email loggé en mode mock',
    );
    return { ok: true, id: null, mock: true };
  }

  try {
    const res = await client.emails.send({
      from: env.RESEND_FROM,
      to: input.to,
      subject: 'Valide ton email SwipeJob',
      html: buildVerificationEmailHtml(input.verificationUrl),
      text: buildVerificationEmailText(input.verificationUrl),
    });
    if (res.error) {
      logger.error({ err: res.error, to: input.to }, 'Resend send returned error');
      return { ok: false, error: res.error.message };
    }
    return { ok: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, to: input.to }, 'Resend send threw');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
