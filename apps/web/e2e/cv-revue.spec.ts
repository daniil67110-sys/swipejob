import { test, expect } from '@playwright/test';

test('/etape-1-cv/revue sans auth → redirect /inscription', async ({ page }) => {
  await page.goto('/etape-1-cv/revue');
  await expect(page).toHaveURL(/\/inscription/);
});
