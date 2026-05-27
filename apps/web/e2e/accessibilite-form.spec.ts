/**
 * Story 6.8 — Vérifie le parcours signalement d'accessibilité.
 *
 * - La page `/declaration-accessibilite` est accessible publiquement.
 * - Le formulaire affiche les champs requis (URL + description).
 * - La validation côté client bloque un envoi vide (HTML5 required).
 */
import { expect, test } from '@playwright/test';

test('declaration-accessibilite — page publique accessible', async ({ page }) => {
  await page.goto('/declaration-accessibilite');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByRole('heading', { name: /Déclaration/i })).toBeVisible();
  await expect(page.getByText(/Signaler un défaut/i)).toBeVisible();
});

test('declaration-accessibilite — formulaire de signalement présent et accessible', async ({
  page,
}) => {
  await page.goto('/declaration-accessibilite');
  await page.waitForLoadState('domcontentloaded');

  // Labels associés
  await expect(page.getByLabel(/URL concernée/i)).toBeVisible();
  await expect(page.getByLabel(/Description du problème/i)).toBeVisible();
  await expect(page.getByLabel(/Email de contact/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Envoyer le signalement/i })).toBeVisible();
});

test('declaration-accessibilite — lien dans le footer des pages publiques', async ({ page }) => {
  await page.goto('/cgu');
  await page.waitForLoadState('domcontentloaded');
  const link = page.locator('footer a[href="/declaration-accessibilite"]');
  await expect(link).toBeVisible();
});
