import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('inactive edge cards cannot take pointer focus or open a project', async ({ page, context }) => {
  await context.route('https://github.com/**', route => route.fulfill({ body: 'Project destination' }));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#work');
  await page.evaluate(() => document.fonts.ready);
  const rail = page.getByLabel('左右滑动浏览项目');
  await rail.scrollIntoViewIfNeeded();
  const box = (await rail.boundingBox())!;
  const popups: string[] = [];
  page.on('popup', popup => popups.push(popup.url()));
  await page.mouse.move(box.x + 12, box.y + 100);
  await page.mouse.down();
  await expect(rail.locator('a[aria-hidden="true"]:focus')).toHaveCount(0);
  await page.mouse.up();
  // Programmatic focus must not sneak into an inactive link either.
  const inactive = rail.locator('a[aria-hidden="true"]').first();
  await inactive.evaluate(element => element.focus());
  await expect(inactive).not.toBeFocused();
  const active = page.getByRole('link', { name: 'Deepulse（GitHub，新标签页）' });
  await active.focus();
  const popupPromise = page.waitForEvent('popup');
  await active.press('Enter');
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://github.com/hebi-Chinese/Deepulse');
  expect(popups).toHaveLength(1);
  await popup.close();
});

test('normal-motion mobile navigation retains rapid keyboard requests', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#work');
  await page.evaluate(() => document.fonts.ready);
  const status = page.getByRole('status', { name: '当前项目' });
  const active = page.getByRole('link', { name: /（GitHub，新标签页）/ });
  await expect(status).toHaveText('01 / 05 · Deepulse');
  await active.focus();
  for (let repeat = 0; repeat < 5; repeat++) {
    await page.keyboard.down('ArrowRight');
    // Reproduce a held key's repeat cadence while smooth scrolling is still in flight.
    await page.waitForTimeout(30);
  }
  await page.keyboard.up('ArrowRight');
  await expect(status).toHaveText('01 / 05 · Deepulse');
  await expect.poll(async () => {
    const box = (await active.boundingBox())!;
    return Math.abs(box.x + box.width / 2 - 187.5);
  }).toBeLessThan(2);
  await expect(active).toBeFocused();
});

test('rapid buttons reverse and retain their destination through a resize', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#work');
  await page.evaluate(() => document.fonts.ready);
  const status = page.getByRole('status', { name: '当前项目' });
  const next = page.getByRole('button', { name: '下一个项目' });
  const previous = page.getByRole('button', { name: '上一个项目' });
  await next.dblclick({ delay: 30 });
  await expect(status).toHaveText('03 / 05 · MIKU for Codex');
  await previous.dblclick({ delay: 30 });
  await expect(status).toHaveText('01 / 05 · Deepulse');
  await previous.click();
  await page.setViewportSize({ width: 430, height: 932 });
  await expect(status).toHaveText('05 / 05 · Euterpe');
  await next.dblclick({ delay: 30 });
  await expect(status).toHaveText('02 / 05 · Codex 工作看板');
  const active = page.getByRole('link', { name: /（GitHub，新标签页）/ });
  await expect.poll(async () => {
    const box = (await active.boundingBox())!;
    return Math.abs(box.x + box.width / 2 - 215);
  }).toBeLessThan(2);
});

test.describe('mobile touch links', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

  test('only the centered card responds to tapping', async ({ page, context }) => {
    await context.route('https://github.com/**', route => route.fulfill({ body: 'Project destination' }));
    await page.goto('/#work');
    await page.evaluate(() => document.fonts.ready);
    const rail = page.getByLabel('左右滑动浏览项目');
    await rail.scrollIntoViewIfNeeded();
    const box = (await rail.boundingBox())!;
    await page.touchscreen.tap(box.x + 12, box.y + 100);
    await expect(rail.locator('a[aria-hidden="true"]:focus')).toHaveCount(0);
    await expect(page.getByRole('status', { name: '当前项目' })).toHaveText('01 / 05 · Deepulse');
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Deepulse（GitHub，新标签页）' }).tap();
    const popup = await popupPromise;
    await expect(popup).toHaveURL('https://github.com/hebi-Chinese/Deepulse');
    expect(context.pages()).toHaveLength(2);
    await popup.close();
  });
});

for (const width of [320, 375, 430]) {
  test(`mobile composition alternates profile and compacts extras at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#about');
    const positions = await page.locator('[data-profile-key]').evaluateAll(rows => rows.map(row => {
      const title = row.querySelector('h3')!.getBoundingClientRect();
      const glyph = row.querySelector('[data-profile-glyph]')!.getBoundingClientRect();
      return title.x < glyph.x;
    }));
    expect(positions).toEqual([true, false, true, false, true, false]);
    const likesTitle = (await page.getByRole('heading', { name: '推荐的东西', exact: true }).boundingBox())!;
    const likesGlyph = (await page.getByRole('img', { name: '推荐的东西', exact: true }).boundingBox())!;
    expect(likesGlyph.x).toBeGreaterThan(likesTitle.x);
    expect(likesGlyph.y).toBeLessThan(likesTitle.y + likesTitle.height);
    const nowCopy = (await page.getByText('主线：学习。副本：即将解锁。').boundingBox())!;
    const nowGlyph = (await page.getByRole('img', { name: '当下', exact: true }).boundingBox())!;
    expect(nowGlyph.y).toBeGreaterThan(nowCopy.y + nowCopy.height);
    expect(nowGlyph.y - nowCopy.y - nowCopy.height).toBeLessThan(30);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test('mobile cards loop both ways, preserve links and selection across resizing', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#work');
  const status = page.getByRole('status', { name: '当前项目' });
  const next = page.getByRole('button', { name: '下一个项目' });
  const previous = page.getByRole('button', { name: '上一个项目' });
  await expect(status).toHaveText('01 / 05 · Deepulse');
  await previous.click();
  await expect(status).toHaveText('05 / 05 · Euterpe');
  await next.click();
  await expect(status).toHaveText('01 / 05 · Deepulse');
  for (const number of ['02', '03', '04', '05', '01']) {
    await next.click();
    await expect(status).toContainText(`${number} / 05`);
  }
  await previous.click();
  await page.setViewportSize({ width: 430, height: 932 });
  await expect(status).toHaveText('05 / 05 · Euterpe');
  const active = page.getByRole('link', { name: /（GitHub，新标签页）/ });
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('href', 'https://github.com/Euterpe-org/Euterpe');
  const box = (await active.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(430);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByLabel('3D 项目轮盘')).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(status).toHaveText('05 / 05 · Euterpe');
});

test('mobile native scrolling and keyboard cross boundaries with accessible active links', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route('https://github.com/**', route => route.fulfill({ body: 'Project destination' }));
  await page.goto('/#work');
  const status = page.getByRole('status', { name: '当前项目' });
  const rail = page.getByLabel('左右滑动浏览项目');
  const active = page.getByRole('link', { name: /（GitHub，新标签页）/ });
  await expect(status).toHaveText('01 / 05 · Deepulse');
  await rail.evaluate(el => el.scrollBy({ left: -el.clientWidth * .8, behavior: 'smooth' }));
  await expect(status).toHaveText('05 / 05 · Euterpe');
  await expect.poll(async () => {
    const box = (await active.boundingBox())!;
    return Math.abs(box.x + box.width / 2 - 195);
  }).toBeLessThan(2);
  await active.focus();
  await active.press('ArrowRight');
  await expect(status).toHaveText('01 / 05 · Deepulse');
  await expect(active).toBeFocused();
  const popupPromise = page.waitForEvent('popup');
  await active.press('Enter');
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://github.com/hebi-Chinese/Deepulse');
  await popup.close();
  const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations;
  expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
});
