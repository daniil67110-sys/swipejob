import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('/inscription affiche le bouton ou le placeholder selon la config', async ({ page }) => {
  await page.goto('/inscription');
  await expect(page.getByRole('heading', { name: /Crée ton compte/i })).toBeVisible();

  // Le bouton ou le placeholder doit être présent selon AUTH_GOOGLE_ID
  const googleButton = page.getByRole('button', { name: /Google/i });
  const placeholder = page.getByText(/OAuth Google non configuré/i);
  expect(
    (await googleButton.isVisible().catch(() => false)) ||
      (await placeholder.isVisible().catch(() => false)),
  ).toBe(true);
});

test('/inscription a11y — pas de violations sérieuses/critiques', async ({ page }) => {
  await page.goto('/inscription');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(blocking).toHaveLength(0);
});

test('/inscription affiche un message FR sur ?error=access_denied', async ({ page }) => {
  await page.goto('/inscription?error=access_denied');
  await expect(page.getByRole('alert')).toContainText(/refusé/i);
});

test('routes protégées redirigent vers /inscription quand non connecté', async ({ page }) => {
  await page.goto('/deck');
  await expect(page).toHaveURL(/\/inscription/);
});
