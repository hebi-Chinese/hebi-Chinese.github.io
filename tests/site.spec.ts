import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/about',
  '/projects',
  '/notes',
  '/essays',
  '/essays/post-01',
  '/likes',
  '/now',
];

for (const route of publicRoutes) {
  test(`${route} has one page heading, no overflow, and no console error`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    const response = await page.goto(route);

    expect(response?.ok()).toBe(true);
    const pageHeadingCount = await page.evaluate(() => document.querySelectorAll('h1').length);
    expect(pageHeadingCount).toBe(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(consoleErrors).toEqual([]);
  });
}

for (const route of ['/', '/about', '/projects', '/notes', '/essays', '/essays/post-01']) {
  test(`${route} has no serious WCAG 2.1 AA violation`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const blockingViolations = results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');

    expect(blockingViolations).toEqual([]);
  });
}

test('the site favicon is available', async ({ request }) => {
  const response = await request.get('/favicon.svg');
  expect(response.status()).toBe(200);
});

test('about profile headings follow the page hierarchy', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { level: 1, name: '关于这个人' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(6);
});

const responsiveCases = [
  { width: 320, height: 700 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

for (const viewport of responsiveCases) {
  for (const route of ['/', '/about', '/projects']) {
    test(`${route} fits ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(route);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator('main, [data-hero-about-flow]').first()).toBeVisible();
    });
  }
}
