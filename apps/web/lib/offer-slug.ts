/**
 * Story 5.4 — Helpers slug d'offre pour URL publique partageable.
 *
 * Pattern : `/offres/<slug>-<id>` où le slug est décoratif (titre kebab-case)
 * et l'id sert de clé de lookup. Approche éprouvée (Stack Overflow, GitHub).
 *
 * Avantages :
 * - Pas de migration DB (slug dérivé du titre + id).
 * - URL stable si le titre change (l'id reste).
 * - SEO friendly (le slug est dans le path).
 *
 * Helpers purs (no I/O) — testables sans setup.
 */

const MAX_SLUG_LENGTH = 60;

/** Construit l'URL path d'une offre : `/offres/dev-front-end-chez-acme-abc123`. */
export function buildOfferSlug(title: string, id: string): string {
  const titleSlug = slugify(title).slice(0, MAX_SLUG_LENGTH).replace(/-+$/, '');
  return titleSlug ? `${titleSlug}-${id}` : id;
}

export function buildOfferUrl(siteUrl: string, title: string, id: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}/offres/${buildOfferSlug(title, id)}`;
}

/**
 * Extrait l'id depuis un slug `kebab-title-<id>`. L'id est le dernier
 * segment après le dernier `-`. Retourne null si le format est invalide.
 *
 * Convention : l'id est un cuid2 (cuids = alphanumeric, ~24 chars, length variable
 * possible). On accepte tout segment non-vide alphanumeric en fin de chaîne.
 */
export function extractOfferId(slug: string): string | null {
  if (!slug) return null;
  const dashIdx = slug.lastIndexOf('-');
  const candidate = dashIdx === -1 ? slug : slug.slice(dashIdx + 1);
  if (!candidate || !/^[a-z0-9]+$/i.test(candidate)) return null;
  return candidate;
}

/** Kebab-case français (gère accents, ponctuation, multi-espaces). */
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
