import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('/inscription/email affiche le formulaire ou le placeholder selon la config', async ({
  page,
}) => {
  await page.goto('/inscription/email');
  await expect(page.getByRole('heading', { name: /Crée ton compte par email/i })).toBeVisible();

  const form = page.getByRole('button', { name: /Créer mon compte/i });
  const placeholder = page.getByText(/inscription par email n'est pas encore configurée/i);
  expect(
    (await form.isVisible().catch(() => false)) ||
      (await placeholder.isVisible().catch(() => false)),
  ).toBe(true);
});

test('/inscription/email a11y — pas de violations sérieuses/critiques', async ({ page }) => {
  await page.goto('/inscription/email');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(blocking).toHaveLength(0);
});

test('/inscription/email — password trop court → erreur Zod visible', async ({ page }) => {
  await page.goto('/inscription/email');

  // Si le form n'est pas configuré, skip (placeholder visible à la place)
  const submit = page.getByRole('button', { name: /Créer mon compte/i });
  if (!(await submit.isVisible().catch(() => false))) {
    test.skip();
    return;
  }

  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Mot de passe').fill('short1');
  // Trigger validation onBlur
  await page.getByLabel('Mot de passe').blur();
  await expect(page.getByText(/Au moins 10 caractères/i)).toBeVisible();
});

test('/inscription/valider-email sans token → message lien invalide', async ({ page }) => {
  await page.goto('/inscription/valider-email');
  await expect(page.getByRole('heading', { name: /Lien invalide/i })).toBeVisible();
});

test('/connexion expose le formulaire email + lien mot de passe oublié', async ({ page }) => {
  await page.goto('/connexion');
  await expect(page.getByRole('heading', { name: /Reconnecte-toi/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Mot de passe oublié/i })).toBeVisible();
});
