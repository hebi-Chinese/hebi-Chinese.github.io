import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage offers both interfaces in one bookmark surface', async ({ page }) => {
  await page.goto('/');
  const surface = page.getByRole('region', { name: '做过的东西' });
  await expect(surface.getByText('WORK / 03', { exact: true })).toHaveCount(1);
  await surface.getByRole('button', { name: '查看 AOAI', exact: true }).click();
  await expect(surface.getByRole('img', { name: 'AOAI 完整转写工作台界面' })).toBeVisible();
  await expect(surface.getByRole('img', { name: '双棱镜完整产品界面' })).toHaveCount(0);
  const first = surface.getByRole('button', { name: '查看双棱镜', exact: true });
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(first).toBeFocused();
  await expect(surface.getByRole('img', { name: '双棱镜完整产品界面' })).toBeVisible();
});

test('reduced motion keeps both products keyboard accessible without scroll switching', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const surface = page.getByRole('region', { name: '做过的东西' });
  const next = surface.getByRole('button', { name: '查看 AOAI', exact: true });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(next).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.wheel(0, -100);
  await expect(surface.getByRole('img', { name: 'AOAI 完整转写工作台界面' })).toBeVisible();
  await expect(surface.locator('.float-layer').first()).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await surface.getByRole('button', { name: '查看双棱镜' }).click();
  await expect(surface.getByRole('img', { name: '双棱镜完整产品界面' })).toBeVisible();
});

test('without JavaScript both screenshots and descriptions remain readable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const surface = page.getByRole('region', { name: '做过的东西' });
  await expect(surface.getByRole('img')).toHaveCount(2);
  await expect(surface.getByRole('heading', { level: 3 })).toHaveText(['01 / 02双棱镜', '02 / 02AOAI']);
  await expect(surface.getByRole('button')).toHaveCount(0);
  await expect(surface.getByText('从声音到文字，保留已经确认的部分。')).toBeVisible();
  await context.close();
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`showcase fits ${width}px with loaded images and one shared image footprint`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const surface = page.getByRole('region', { name: '做过的东西' });
    await surface.scrollIntoViewIfNeeded();
    await expect.poll(() => surface.locator('img').evaluateAll(images => images.every(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0))).toBe(true);
    const bounds = await surface.locator('img').evaluateAll(images => images.map(img => {
      const r = img.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
    }));
    expect(bounds[0]).toEqual(bounds[1]);
    expect(bounds[0].x).toBeGreaterThanOrEqual(0);
    expect(bounds[0].x + bounds[0].width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test('both selected states have no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const surface = page.getByRole('region', { name: '做过的东西' });
  for (const name of ['查看双棱镜', '查看 AOAI']) {
    await surface.getByRole('button', { name, exact: true }).click();
    const result = await new AxeBuilder({ page }).include('[data-product-showcase]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  }
  await expect(surface.locator('[data-float-object]')).toHaveCount(7);
  await expect(surface.getByRole('button')).toHaveCount(2);
});

test('buffered decoration settles and then leaves no idle frame loop', async ({ page }) => {
  await page.addInitScript(() => {
    const pending = new Set<number>();
    const request = requestAnimationFrame.bind(window);
    const cancel = cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
      const id = request(time => { pending.delete(id); callback(time); });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
    Object.defineProperty(window, '__pendingFrames', { get: () => pending.size });
  });
  await page.goto('/');
  const surface = page.getByRole('region', { name: '做过的东西' });
  await page.evaluate(() => document.fonts.ready);
  await surface.locator('img').first().evaluate(image => {
    const r = image.getBoundingClientRect();
    scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight * .4, behavior: 'instant' });
  });
  // The approved buffer may finish after input stops. Measure idle only after it settles.
  await expect(surface.locator('img').nth(1)).toHaveCSS('opacity', '1');
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__pendingFrames'))).toBe(0);
  const before = await surface.locator('img').evaluateAll(elements => elements.map(el => getComputedStyle(el).opacity));
  // A 250 ms quiet interval checks that a completed buffer does not restart itself.
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => Reflect.get(window, '__pendingFrames'))).toBe(0);
  expect(await surface.locator('img').evaluateAll(elements => elements.map(el => getComputedStyle(el).opacity))).toEqual(before);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__pendingFrames'))).toBe(0);
});
