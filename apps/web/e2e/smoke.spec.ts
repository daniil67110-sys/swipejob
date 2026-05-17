import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/setup', name: 'onboarding setup' },
];

for (const { path, name } of routes) {
  test(`smoke — ${name} (${path}) returns 200 and renders a heading`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });
}

test('smoke — /api/health returns ok JSON', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
  expect(body.service).toBe('web');
});
