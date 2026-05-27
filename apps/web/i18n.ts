/**
 * Story 6.7 — Configuration next-intl.
 *
 * V1 : une seule locale `fr-FR` (Loi Toubon — toute communication produit en français).
 * V2 : ajouter `en`, `es`, `de` selon expansion marché (NFR-L2). Le pattern actuel
 * (un seul fichier `messages/<locale>.json`) supporte la croissance sans refacto.
 *
 * Pas de routing localisé : on utilise next-intl sans middleware locale (l'app
 * a une seule locale donc pas besoin de `/fr/...` dans l'URL).
 */
import { getRequestConfig } from 'next-intl/server';

export const defaultLocale = 'fr-FR' as const;
export const locales = [defaultLocale] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // V1 : locale fixe. En V2, lire un cookie/header pour autres locales.
  const locale = defaultLocale;
  const messages = (await import(`./messages/${locale}.json`)).default as Record<string, unknown>;
  return {
    locale,
    messages,
    timeZone: 'Europe/Paris',
    now: new Date(),
  };
});
