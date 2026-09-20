import { expect, test } from '@playwright/test';

test('home handoff keeps a gridded paper surface visibly tilted through the scroll midpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  const panel = page.locator('.about-flow-panel');
  await expect(panel).toBeVisible();

  const initialMaterial = await panel.evaluate((element) =>
    getComputedStyle(element, '::before').backgroundImage,
  );
  expect(initialMaterial).toContain('linear-gradient');

  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(async () => panel.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.abs(Math.atan2(matrix.m23, matrix.m22) * (180 / Math.PI));
  })).toBeGreaterThan(18);
});

test('desktop scrolling dissolves two interfaces in place without holding the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  const surface = page.getByRole('region', { name: '做过的东西' });
  const first = surface.locator('article').filter({ has: page.getByRole('heading', { name: '双棱镜', includeHidden: true }) });
  const second = surface.locator('article').filter({ has: page.getByRole('heading', { name: 'AOAI', includeHidden: true }) });
  const moveImageCenter = async (fraction: number) => {
    await first.locator('img').evaluate((image, portion) => {
      const rect = image.getBoundingClientRect();
      window.scrollTo({ top: scrollY + rect.top + rect.height / 2 - innerHeight * portion, behavior: 'instant' });
    }, fraction);
  };
  await moveImageCenter(.64);
  await expect(second.locator('img')).toHaveCSS('opacity', '0');
  const before = await surface.boundingBox();
  await moveImageCenter(.42);
  await expect(second.locator('img')).toHaveCSS('opacity', '1');
  await expect(first.locator('img')).toHaveCSS('opacity', '1');
  const middle = await surface.boundingBox();
  expect(middle!.y).toBeLessThan(before!.y - 50);
  expect(middle!.height).toBeCloseTo(before!.height, 0);
  await moveImageCenter(.28);
  await expect(second.locator('img')).toHaveCSS('opacity', '1');
  await expect(second).toHaveAttribute('aria-hidden', 'false');
  await moveImageCenter(.64);
  await expect(second.locator('img')).toHaveCSS('opacity', '0');
  await expect(first).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('heading', { name: '做过的、在做的、想做的' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: '做过的、在做的、想做的' })).toBeInViewport();
});

test('reduced motion keeps content readable and leaves no decorative animation loop running', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const scheduledFrames = new Set<number>();
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelFrame = window.cancelAnimationFrame.bind(window);

    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      let frameId = 0;
      frameId = requestFrame((time) => {
        scheduledFrames.delete(frameId);
        callback(time);
      });
      scheduledFrames.add(frameId);
      return frameId;
    };
    window.cancelAnimationFrame = (frameId: number) => {
      scheduledFrames.delete(frameId);
      cancelFrame(frameId);
    };
    Object.defineProperty(window, '__scheduledAnimationFrameCount', {
      get: () => scheduledFrames.size,
    });
  });

  await page.goto('/');
  await page.waitForTimeout(500);

  const revealOpacity = await page.locator('[data-reveal]').evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).opacity),
  );
  expect(revealOpacity.every((opacity) => Number(opacity) > 0)).toBe(true);

  const runningCssAnimations = await page.evaluate(() =>
    document.getAnimations().filter((animation) => animation.playState === 'running').length,
  );
  expect(runningCssAnimations).toBe(0);

  const scheduledAnimationFrames = await page.evaluate(() =>
    (window as typeof window & { __scheduledAnimationFrameCount: number }).__scheduledAnimationFrameCount,
  );
  expect(scheduledAnimationFrames).toBe(0);
});
