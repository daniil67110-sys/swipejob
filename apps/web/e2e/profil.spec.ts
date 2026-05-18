import { test, expect } from '@playwright/test';

test('/profil sans auth → redirect /inscription', async ({ page }) => {
  await page.goto('/profil');
  await expect(page).toHaveURL(/\/inscription/);
});

test('/profil/supprimer sans auth → redirect /inscription', async ({ page }) => {
  await page.goto('/profil/supprimer');
  await expect(page).toHaveURL(/\/inscription/);
});
