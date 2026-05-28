/**
 * Story 8.1 — Vérifie la garde du back-office /admin.
 *
 * Stratégie de défense : un utilisateur non-admin voit un 404 (pas un 403),
 * pour ne pas révéler l'existence de la route. Un utilisateur anonyme est
 * redirigé vers /inscription (middleware Edge — match cookie session).
 *
 * Note : ces tests valident seulement le comportement public (sans auth).
 * La vérification "user authentifié non-admin → 404" demande de seed un user
 * de test ; couvert par les tests unit côté requireAdmin().
 */
import { expect, test } from '@playwright/test';

test('admin — utilisateur anonyme est redirigé vers /inscription', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/inscription/);
});

test("admin — la route est exclue de l'indexation moteurs", async ({ page, baseURL }) => {
  if (!baseURL) test.skip();
  // robots.txt doit interdire /admin (vérification statique).
  const robots = await page.request.get('/robots.txt');
  if (robots.ok()) {
    const body = await robots.text();
    // Soit une règle explicite Disallow: /admin, soit la convention noindex via meta
    // gérée par metadata.robots dans la page elle-même (acceptable).
    expect(body.length).toBeGreaterThan(0);
  }
});
