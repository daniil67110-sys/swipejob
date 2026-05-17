import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/setup', name: 'onboarding setup' },
];

for (const { path, name } of routes) {
  test(`a11y — ${name} (${path}) has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );

    expect(
      blocking,
      `Found ${blocking.length} blocking a11y violation(s) on ${path}:\n${blocking
        .map((v) => `  - ${v.id} (${v.impact}): ${v.help}`)
        .join('\n')}`,
    ).toHaveLength(0);
  });
}
