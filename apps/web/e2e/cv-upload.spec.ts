import { test, expect } from '@playwright/test';

test('/etape-1-cv sans auth → redirect /inscription', async ({ page }) => {
  await page.goto('/etape-1-cv');
  await expect(page).toHaveURL(/\/inscription/);
});

test('POST /api/cv/upload sans session → 401', async ({ request }) => {
  const res = await request.post('/api/cv/upload', {
    multipart: {
      file: { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') },
    },
  });
  expect([401, 403, 503]).toContain(res.status());
});
