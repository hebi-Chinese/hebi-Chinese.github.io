import { expect, test } from '@playwright/test';

test('restoring motion does not discard pointer input before its change notification', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.addInitScript(() => {
    // Hold native media notifications at the browser boundary, not inside the Hero module.
    const subscribe = EventTarget.prototype.addEventListener;
    const state = window as typeof window & { pendingMotionNotifications: number };
    state.pendingMotionNotifications = 0;
    MediaQueryList.prototype.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
      if (type !== 'change' || !listener) return subscribe.call(this, type, listener, options);
      subscribe.call(this, type, event => {
        state.pendingMotionNotifications += 1;
        setTimeout(() => {
          if (typeof listener === 'function') listener.call(this, event);
          else listener.handleEvent(event);
        }, 0);
      }, options);
    };
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { pendingMotionNotifications: number }).pendingMotionNotifications)).toBeGreaterThan(0);
  const character = page.locator('.hero-name .char').first();
  const rect = (await character.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2 + 20, rect.y + rect.height / 2);
  await page.clock.runFor(64);
  await expect.poll(() => character.evaluate(el => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return Math.hypot(matrix.m41, matrix.m42);
  })).toBeGreaterThan(10);
});

test('Hero stops and restores pointer motion when the preference changes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const character = page.locator('.hero-name .char').first();
  const moveNearCharacter = async () => {
    await page.mouse.move(5, 5);
    const rect = (await character.boundingBox())!;
    await page.mouse.move(rect.x + rect.width / 2 + 20, rect.y + rect.height / 2);
  };
  const displacement = () => character.evaluate(el => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return Math.hypot(matrix.m41, matrix.m42);
  });

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await moveNearCharacter();
  await expect.poll(displacement).toBeGreaterThan(10);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(displacement).toBeLessThan(.01);
  await moveNearCharacter();
  // Check the rendered frame after pointer input, not only the preference-change handler.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await displacement()).toBeLessThan(.01);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await moveNearCharacter();
  await expect.poll(displacement).toBeGreaterThan(10);
});

test('mobile navigation remains usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto('/#about');
  // The fallback font can move a link between hit testing and native mouse input.
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded');
  const navigation = page.locator('[data-navigation]');
  for (const name of ['about', 'work', 'essays', 'notes', 'likes', 'github', 'contact']) {
    await expect(navigation.getByRole('link', { name, exact: true })).toBeVisible();
  }
  await expect(navigation.getByRole('button')).toHaveCount(0);
  await navigation.getByRole('link', { name: 'notes', exact: true }).click();
  await expect(page).toHaveURL(/\/notes\/?$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await context.close();
});
