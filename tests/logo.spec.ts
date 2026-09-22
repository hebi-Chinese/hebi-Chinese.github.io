import { expect, test } from '@playwright/test';

test('v1.4.1 logo asset serves the approved softened blue and green palette', async ({ request }) => {
  const response = await request.get('/brand/hebi-logo-v1.svg');
  expect(response.ok()).toBe(true);
  const svg = await response.text();
  expect(svg).toContain('fill="#203447"');
  expect(svg).toContain('fill="#98ad99"');
  expect(svg).toContain('fill="#c1ccd0"');
  expect(svg).not.toContain('#182d43');
  expect(svg).not.toContain('#bd7d2b');
  expect(svg).not.toContain('#e52629');
  expect(svg).not.toContain('#101010');
});

test('homepage displays the approved logo and keeps the home link accessible', async ({ page }) => {
  await page.goto('/');
  const home = page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '何必' , exact: true });
  await expect(home).toHaveAttribute('href', '/');
  await expect(home.locator('img')).toBeVisible();
  await expect(home.locator('img')).toHaveAttribute('src', '/brand/hebi-logo-v1.svg');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('何必');
  const heroLogo = page.locator('main img[src="/brand/hebi-logo-v1.svg"]');
  await expect(heroLogo).toBeVisible();
  await expect(heroLogo).toHaveAttribute('alt', '');
  await expect.poll(() => heroLogo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(heroLogo).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    if (width >= 1024) {
      const mark = await heroLogo.boundingBox();
      const heading = await page.getByRole('heading', { level: 1 }).boundingBox();
      expect(mark!.x).toBeGreaterThan(heading!.x + heading!.width);
      expect(mark!.width).toBeGreaterThan(200);
    }
  }
  await page.goto('/notes');
  await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '何必', exact: true }).locator('img')).toHaveAttribute('src', '/brand/hebi-logo-v1.svg');
});
