import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/about',
  '/projects',
  '/notes',
  '/notes/typing-or-speaking',
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

for (const route of ['/', '/about', '/projects', '/notes', '/notes/typing-or-speaking', '/essays', '/essays/post-01']) {
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

test('homepage uses the editorial introduction and section hierarchy', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: '何 必' })).toBeVisible();
  await expect(page.getByText(/在毕业，也在做反作弊/)).toBeVisible();
  await expect(page.getByRole('link', { name: '查看项目' })).toBeVisible();
  await expect(page.getByRole('link', { name: '发封邮件' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '做过的东西' })).toHaveCount(1);
  const showcase = page.getByRole('region', { name: '做过的东西' });
  await expect(showcase.getByRole('button', { name: '查看双棱镜' })).toHaveCount(1);
  await expect(showcase.getByRole('button', { name: '查看 AOAI' })).toHaveCount(1);
  await expect(page.getByText('cat /etc/hebi/profile')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: '经常碰到的技术' })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 2, name: '最近写下来的' })).toHaveCount(1);
  await expect(page.getByText('主线：学习')).toHaveCount(0);
  await expect(page.getByText('副本：???')).toHaveCount(0);
});

test('about profile headings follow the page hierarchy', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { level: 1, name: '关于这个人' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(6);

  const expectedHeadings = [
    '真爱换季',
    '拍定乾坤',
    '预算拉满',
    '未来筹码',
    '公开留痕',
    '此刻坐标',
  ];
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(expectedHeadings);
  await expect(page.locator('[data-profile-glyph]')).toHaveCount(6);
  await expect(page.getByText('待补')).toHaveCount(0);
});

test('the homepage about surface omits the rejected lead copy', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('很多东西写下来的时候可能就已经过期了。')).toHaveCount(0);
});

test('about linked glyphs fill the profile list height on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1003, height: 869 });
  await page.goto('/about');

  await expect(page.locator('[data-profile-path]')).toHaveCount(1);
  const heightDifference = await page.evaluate(() => {
    const visual = document.querySelector('.about-visual-slot')?.getBoundingClientRect();
    const list = document.querySelector('.profile-list')?.getBoundingClientRect();
    if (!visual || !list) return Number.POSITIVE_INFINITY;
    return Math.abs(visual.height - list.height);
  });
  expect(heightDifference).toBeLessThanOrEqual(1);
});

test('notes preserve the authored date and optional time', async ({ page }) => {
  await page.goto('/notes');

  const timestamp = page.locator('time').first();
  await expect(timestamp).toHaveText('2026/08/12 · 11:30');
  await expect(timestamp).toHaveAttribute('datetime', '2026-08-12T11:30:00');
});

test('essays preserve the authored calendar date', async ({ page }) => {
  await page.goto('/essays');

  const timestamp = page.locator('time').first();
  await expect(timestamp).toHaveText('2026/05/10');
  await expect(timestamp).toHaveAttribute('datetime', '2026-05-10');
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
