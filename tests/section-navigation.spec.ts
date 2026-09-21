import { expect, test } from '@playwright/test';

test('About scrolls the same document to a flat readable panel and Work keeps all home content', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => Object.assign(window, { navigationSentinel: 'same-document' }));
  const nav = page.getByRole('navigation', { name: '主导航', exact: true });
  await nav.getByRole('link', { name: 'about', exact: true }).click();
  await expect(page).toHaveURL(/\/#about$/);
  expect(await page.evaluate(() => (window as any).navigationSentinel)).toBe('same-document');
  const title = page.getByRole('heading', { name: '关于这个人', exact: true });
  await expect(title).toBeFocused();
  await expect.poll(() => title.evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(52);
  await expect.poll(() => page.locator('.about-flow-panel').evaluate(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m23))).toBeLessThan(.001);
  await nav.getByRole('link', { name: 'work', exact: true }).click();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(page.getByRole('heading', { name: '做过的、在做的、想做的', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: '关于这个人', exact: true, includeHidden: true })).toHaveCount(1);
  await expect(page.getByRole('region', { name: '做过的东西' })).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/\/#about$/);
  await expect(title).toBeFocused();
});

test('reading pages retain the SVG logo and return to the complete home section', async ({ page }) => {
  await page.goto('/notes/typing-or-speaking');
  const nav = page.getByRole('navigation', { name: '主导航', exact: true });
  await expect(nav.getByRole('link', { name: '何必', exact: true }).locator('img')).toHaveAttribute('src', '/brand/hebi-logo-v1.svg');
  await nav.getByRole('link', { name: 'about', exact: true }).click();
  await expect(page).toHaveURL(/\/#about$/);
  await expect(page.getByRole('heading', { name: '关于这个人', exact: true })).toBeInViewport();
});

for (const [route, fragment] of [['about', 'about'], ['projects', 'work'], ['likes', 'likes'], ['now', 'now']]) {
  test(`legacy /${route} redirects to the home fragment`, async ({ page }) => {
    await page.goto(`/${route}`);
    await expect(page).toHaveURL(new RegExp('/#' + fragment + '$'));
    await expect(page.locator('h1')).toHaveText('何必');
  });
}

test('mobile About closes the menu, moves focus, and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: '打开导航' }).click();
  await page.locator('[data-navigation-menu]').getByRole('link', { name: 'about', exact: true }).click();
  await expect(page).toHaveURL(/\/#about$/);
  await expect(page.getByRole('button', { name: '打开导航' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { name: '关于这个人', exact: true })).toBeFocused();
  await expect(page.locator('.about-flow-panel')).toHaveCSS('transform', 'none');
});

test('Likes is part of home and preserves the existing recommendation and Now text', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: '主导航', exact: true }).getByRole('link', { name: 'likes', exact: true }).click();
  await expect(page).toHaveURL(/\/#likes$/);
  await expect(page.getByRole('heading', { name: '推荐的东西', exact: true })).toBeFocused();
  await expect(page.getByText('最近发现 vibe coding 很好用，将 vibe coding 融入为生活的一部分，我感觉这是我保持活力的源泉之一。有了 vibe coding，对于现代生活的感知，也会变得不一样起来。')).toBeVisible();
  await expect(page.getByText('主线：学习。副本：即将解锁。')).toHaveCount(1);
});

test('without JavaScript legacy routes and native homepage anchors remain usable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('/about');
  await expect(page).toHaveURL(/\/#about$/);
  await expect(page.getByRole('heading', { name: '关于这个人', exact: true })).toBeInViewport();
  await page.getByRole('navigation', { name: '主导航', exact: true }).getByRole('link', { name: 'likes', exact: true }).click();
  await expect(page).toHaveURL(/\/#likes$/);
  await expect(page.getByRole('heading', { name: '推荐的东西', exact: true })).toBeInViewport();
  await context.close();
});

test('a direct About bookmark reload lands on the flat panel', async ({ page }) => {
  await page.goto('/#about');
  await page.reload();
  const heading = page.getByRole('heading', { name: '关于这个人', exact: true });
  await expect(heading).toBeInViewport();
  await expect.poll(() => page.locator('.about-flow-panel').evaluate(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m23))).toBeLessThan(.001);
});

test('scroll navigation has intermediate positions and manual input cancels it', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.getByRole('navigation', { name: '主导航', exact: true }).getByRole('link', { name: 'likes', exact: true }).click();
  await page.clock.runFor(100);
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(0);
  expect(await page.locator('#likes').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(100);
  await page.keyboard.press('Escape');
  await page.clock.runFor(800);
  expect(await page.evaluate(() => scrollY)).toBe(before);
});
