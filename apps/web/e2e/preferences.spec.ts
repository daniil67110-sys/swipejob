import { test, expect } from '@playwright/test';

test('/etape-2-preferences sans auth → redirect /inscription', async ({ page }) => {
  await page.goto('/etape-2-preferences');
  await expect(page).toHaveURL(/\/inscription/);
});
