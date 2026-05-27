/**
 * Story 6.7 — Vérifie la conformité Loi Toubon (toute communication produite
 * destinée au marché français est en français — Loi du 4 août 1994).
 *
 * Stratégie de test :
 * 1. `<html lang>` commence par "fr".
 * 2. Aucune string EN typique (mots de UI courants en anglais) dans le rendu
 *    des pages publiques. Liste curated pour éviter faux positifs sur des mots
 *    qui existent aussi en français (email, signup, etc.).
 * 3. Présence de chaînes FR canoniques (preuve positive du rendu en français).
 */
import { expect, test } from '@playwright/test';

const PUBLIC_ROUTES = [
  '/',
  '/connexion',
  '/inscription',
  '/cgu',
  '/politique-confidentialite',
  '/cookies',
  '/mentions-legales',
];

// Strings EN typiques d'UI qui n'ont rien à faire sur une app FR.
// Cf. https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000349929/ (Loi Toubon).
const FORBIDDEN_EN_STRINGS = [
  'Sign in with',
  'Sign up with',
  'Log in',
  'Log out',
  'Forgot password',
  'Submit',
  'Loading...',
  'Welcome back',
  'Search jobs',
  'Apply now',
  'Continue with',
  'Privacy Policy',
  'Terms of Service',
  'Cookie Policy',
];

for (const route of PUBLIC_ROUTES) {
  test(`Loi Toubon — ${route} rendered in French`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');

    // 1. html lang
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang, `<html lang> manquant sur ${route}`).toBeTruthy();
    expect(
      lang!.toLowerCase().startsWith('fr'),
      `<html lang="${lang}"> n'est pas français sur ${route}`,
    ).toBe(true);

    // 2. Pas de strings EN typiques
    const bodyText = await page.locator('body').innerText();
    const found = FORBIDDEN_EN_STRINGS.filter((s) =>
      bodyText.toLowerCase().includes(s.toLowerCase()),
    );
    expect(
      found,
      `Strings EN détectées sur ${route} :\n${found.map((s) => `  - "${s}"`).join('\n')}`,
    ).toHaveLength(0);
  });
}

test('Loi Toubon — landing affiche des chaînes FR canoniques', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const body = await page.locator('body').innerText();
  // Preuve positive : au moins l'une de ces chaînes FR doit apparaître.
  const canonical = ['Connexion', 'Inscription', 'Découvrir', 'Trouve', 'recherche', 'offres'];
  const hasOne = canonical.some((s) => body.toLowerCase().includes(s.toLowerCase()));
  expect(hasOne, `Aucune chaîne FR canonique trouvée sur /`).toBe(true);
});
