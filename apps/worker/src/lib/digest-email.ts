import { Resend } from 'resend';
import { env, isResendConfigured } from './env.js';
import logger from './logger.js';

let cached: Resend | null = null;

function client(): Resend | null {
  if (!isResendConfigured || !env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export type WeeklyDigestInput = {
  to: string;
  firstName: string | null;
  swipesCount: number;
  applicationsCount: number;
  statusUpdatesCount: number;
  topOffers: Array<{
    id: string;
    title: string;
    companyName: string | null;
    locationCity: string | null;
  }>;
  unsubscribeUrl: string;
  deckUrl: string;
  weekLabel: string; // ex "13 → 19 mai"
};

export type SendDigestResult =
  | { ok: true; id: string }
  | { ok: true; id: null; mock: true }
  | { ok: false; error: string };

/**
 * Story 4.5 — Email digest hebdomadaire (dimanche 19h Paris).
 */
export async function sendWeeklyDigestEmail(input: WeeklyDigestInput): Promise<SendDigestResult> {
  const c = client();
  const subject = `Ton récap SwipeJob (${input.weekLabel}) ✨`;
  if (!c) {
    logger.warn({ to: redact(input.to), subject }, 'Resend not configured — digest send mock');
    return { ok: true, id: null, mock: true };
  }
  const html = buildHtml(input);
  const text = buildText(input);
  try {
    const res = await c.emails.send({
      from: env.RESEND_FROM,
      to: input.to,
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${input.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, 'Resend digest send failed');
    return { ok: false, error: msg };
  }
}

function redact(email: string): string {
  return email.replace(/(.).+(@.+)/, '$1***$2');
}

function buildHtml(d: WeeklyDigestInput): string {
  const greeting = d.firstName ? `Salut ${escapeHtml(d.firstName)} 👋` : 'Salut 👋';
  const top =
    d.topOffers.length > 0
      ? `<h2 style="font-size:16px;margin:24px 0 8px">Top 3 offres pour la semaine</h2><ul>${d.topOffers
          .map(
            (o) =>
              `<li><strong>${escapeHtml(o.title)}</strong>${
                o.companyName ? ` · ${escapeHtml(o.companyName)}` : ''
              }${o.locationCity ? ` · ${escapeHtml(o.locationCity)}` : ''}</li>`,
          )
          .join('')}</ul>`
      : '';

  return `<!doctype html>
<html lang="fr">
  <body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 12px">${greeting}</h1>
    <p>Voici ton récap de la semaine (${escapeHtml(d.weekLabel)}) :</p>
    <ul style="line-height:1.8">
      <li>🃏 <strong>${d.swipesCount}</strong> swipes cette semaine</li>
      <li>💌 <strong>${d.applicationsCount}</strong> candidatures envoyées</li>
      <li>🔄 <strong>${d.statusUpdatesCount}</strong> mises à jour de statut</li>
    </ul>
    ${top}
    <p style="margin:24px 0">
      <a href="${escapeAttr(d.deckUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Ouvrir mon deck</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">
      Tu reçois cet email parce que tu as activé le récap hebdomadaire dans tes paramètres.<br>
      <a href="${escapeAttr(d.unsubscribeUrl)}" style="color:#2563eb">Se désabonner en un clic</a>
    </p>
  </body>
</html>`;
}

function buildText(d: WeeklyDigestInput): string {
  return [
    d.firstName ? `Salut ${d.firstName} !` : 'Salut !',
    `Récap semaine ${d.weekLabel} :`,
    `- ${d.swipesCount} swipes`,
    `- ${d.applicationsCount} candidatures`,
    `- ${d.statusUpdatesCount} mises à jour`,
    '',
    d.topOffers.length > 0 ? 'Top 3 offres :' : '',
    ...d.topOffers.map(
      (o) =>
        `- ${o.title}${o.companyName ? ' · ' + o.companyName : ''}${
          o.locationCity ? ' · ' + o.locationCity : ''
        }`,
    ),
    '',
    `Ouvrir mon deck : ${d.deckUrl}`,
    `Se désabonner : ${d.unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
