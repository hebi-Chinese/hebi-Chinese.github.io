import { expect, test } from '@playwright/test';

test('About responds to motion-preference changes in both directions', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const panel = page.locator('.about-flow-panel');
  const stage = page.locator('[data-about-flow-stage]');
  await expect(panel).toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await stage.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top + 200, behavior: 'instant' }));
  await expect.poll(() => panel.evaluate(el => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return Math.abs(Math.atan2(m.m23, m.m22));
  })).toBeLessThan(.001);
  await expect(stage).toHaveCSS('pointer-events', 'auto');
  await page.evaluate(() => scrollTo({ top: 400, behavior: 'instant' }));
  await expect.poll(() => panel.evaluate(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m23))).toBeGreaterThan(.1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(panel).toHaveCSS('transform', 'none');
  await expect(stage).toHaveCSS('pointer-events', 'auto');
});

for (const width of [320, 375, 768, 1024, 1440]) {
  for (const route of ['/', '/#work']) {
    test(`${route}: all project links remain readable without JavaScript at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.goto(route);
      const links = page.getByRole('link', { name: /（GitHub，新标签页）/ });
      await expect(links).toHaveCount(5);
      for (const link of await links.all()) await expect(link).toBeVisible();
      const overlaps = await links.evaluateAll(elements => {
        const rects = elements.map(el => el.getBoundingClientRect());
        return rects.some((a, i) => rects.slice(i + 1).some(b =>
          Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)));
      });
      expect(overlaps).toBe(false);
      await expect(page.getByRole('button', { name: '下一个项目' })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await context.close();
    });
  }
}

test('site index matches the main navigation and derives its count', async ({ page }) => {
  await page.goto('/');
  const index = page.getByRole('navigation', { name: '站点索引' });
  const links = index.getByRole('link');
  const navigation = page.getByRole('navigation', { name: '主导航', exact: true });
  for (const link of await links.all()) {
    const label = (await link.getAttribute('aria-label'))!.replace('站点索引：', '');
    await expect(link).toHaveAttribute('href', (await navigation.getByRole('link', { name: label, exact: true }).getAttribute('href'))!);
  }
  await expect(index).toContainText(`SITE / INDEX ${String(await links.count()).padStart(2, '0')}`);
});

test('About header keeps readable opacity with the approved 80px type size', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#about', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 2, name: '关于这个人' });
  expect(await heading.evaluate(el => getComputedStyle(el.parentElement!.parentElement!).opacity)).toBe('1');
  await expect(heading).toHaveCSS('font-size', '80px');
});
