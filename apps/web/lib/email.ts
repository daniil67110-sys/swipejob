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

export type SendParentalConsentEmailInput = {
  to: string;
  childEmail: string;
  parentName: string;
  confirmUrl: string;
  refuseUrl: string;
  expiresAt: Date;
};

export function buildParentalConsentEmailHtml(input: SendParentalConsentEmailInput): string {
  const expires = input.expiresAt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return `<!doctype html>
<html lang="fr">
  <body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">SwipeJob — Consentement parental requis</h1>
    <p>Bonjour ${escapeHtml(input.parentName)},</p>
    <p>
      <strong>${escapeHtml(input.childEmail)}</strong> souhaite s'inscrire sur
      <strong>SwipeJob</strong>, une plateforme française qui aide les étudiants à trouver
      des stages et alternances.
    </p>
    <p>
      Cette personne a entre 13 et 17 ans. La loi française nous oblige à obtenir votre
      accord explicite (en tant que parent ou tuteur légal) avant de traiter ses données.
    </p>
    <p><strong>Données collectées :</strong> email, nom, CV, préférences professionnelles.
      Pas de publicité, pas de cookie tiers, hébergement France/UE.
      <a href="https://swipejob.fr/politique-confidentialite" style="color:#2563eb">
        Politique de confidentialité complète
      </a>.
    </p>
    <p style="margin:24px 0;display:flex;gap:12px;flex-wrap:wrap">
      <a href="${input.confirmUrl}"
         style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">
        ✅ J'autorise
      </a>
      <a href="${input.refuseUrl}"
         style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">
        ❌ Je refuse
      </a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">
      Liens valides jusqu'au ${expires}. Si vous n'êtes pas le parent ou tuteur légal de
      ${escapeHtml(input.childEmail)}, ignorez ce message — aucun compte n'est activé sans
      votre accord.
    </p>
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

export async function sendParentalConsentEmail(
  input: SendParentalConsentEmailInput,
): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) {
    // PII : pas de `to` (email parent) ni `confirmUrl` (token plain) dans les logs.
    // Le dev qui debug verra dans la console runtime que l'email est mock — pas besoin de leak.
    logger.warn(
      { childEmailMasked: input.childEmail.replace(/(.).+(@.+)/, '$1***$2') },
      'Resend non configuré — email parental mock',
    );
    return { ok: true, id: null, mock: true };
  }
  try {
    const res = await client.emails.send({
      from: env.RESEND_FROM,
      to: input.to,
      subject: 'SwipeJob — Consentement parental requis',
      html: buildParentalConsentEmailHtml(input),
      text: `${input.childEmail} souhaite s'inscrire sur SwipeJob.\nAutoriser : ${input.confirmUrl}\nRefuser : ${input.refuseUrl}`,
    });
    if (res.error) {
      logger.error({ err: res.error, to: input.to }, 'Resend parental send error');
      return { ok: false, error: res.error.message };
    }
    return { ok: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, to: input.to }, 'Resend parental threw');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

export async function sendAccountDeletionEmail(input: {
  to: string;
  restoreUrl?: string;
  scheduledFor?: Date;
  restoreExpiresAt?: Date;
}): Promise<SendEmailResult> {
  const client = getClient();
  const scheduled = input.scheduledFor?.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const restoreExpires = input.restoreExpiresAt?.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const restoreBlock =
    input.restoreUrl && restoreExpires
      ? `<p>Si c'était une erreur, tu peux annuler cette demande jusqu'au <strong>${restoreExpires}</strong> :</p>
    <p style="margin:20px 0">
      <a href="${input.restoreUrl}" style="display:inline-block;background:#1FB87A;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">
        Annuler la suppression
      </a>
    </p>`
      : '<p>Si c\'était une erreur, contacte <a href="mailto:dpo@swipejob.fr">dpo@swipejob.fr</a> dans les 7 jours.</p>';
  const html = `<!doctype html>
<html lang="fr">
  <body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">SwipeJob — Confirmation de suppression de ton compte</h1>
    <p>Bonjour,</p>
    <p>Ta demande de suppression a bien été enregistrée. Ton compte est désactivé immédiatement et tes données seront effacées${scheduled ? ` le <strong>${scheduled}</strong>` : ' sous 30 jours maximum'}.</p>
    ${restoreBlock}
    <p style="color:#555;font-size:13px">Passé cette date, la suppression sera irréversible (RGPD art. 17).</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">Merci d'avoir utilisé SwipeJob.</p>
  </body>
</html>`;
  const text =
    input.restoreUrl && restoreExpires
      ? `Ton compte est désactivé. Suppression définitive${scheduled ? ` le ${scheduled}` : ' sous 30j'}. Rétractation possible jusqu'au ${restoreExpires} : ${input.restoreUrl}`
      : 'Ton compte SwipeJob est désactivé. Suppression effective sous 30 jours (RGPD).';
  if (!client) {
    logger.warn({ to: input.to }, 'Resend non configuré — deletion email mock');
    return { ok: true, id: null, mock: true };
  }
  try {
    const res = await client.emails.send({
      from: env.RESEND_FROM,
      to: input.to,
      subject: 'SwipeJob — Confirmation de suppression de ton compte',
      html,
      text,
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    logger.error({ err, to: input.to }, 'deletion email failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
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
