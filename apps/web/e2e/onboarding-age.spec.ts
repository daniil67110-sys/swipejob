import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('/age sans auth → redirect /inscription', async ({ page }) => {
  await page.goto('/age');
  await expect(page).toHaveURL(/\/inscription/);
});

test('/age/refus-mineur affiche le message FR', async ({ page }) => {
  await page.goto('/age/refus-mineur');
  await expect(page.getByRole('heading', { name: /pas accessible avant 13/i })).toBeVisible();
});

test('/age/refus-mineur a11y — pas de violations critiques', async ({ page }) => {
  await page.goto('/age/refus-mineur');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(blocking).toHaveLength(0);
});

test('/consentement-parental/confirmer sans token → message invalide', async ({ page }) => {
  await page.goto('/consentement-parental/confirmer');
  await expect(page.getByRole('heading', { name: /Lien invalide/i })).toBeVisible();
});

test('/consentement-parental/refuser sans token → message invalide', async ({ page }) => {
  await page.goto('/consentement-parental/refuser');
  await expect(page.getByRole('heading', { name: /Lien invalide/i })).toBeVisible();
});
