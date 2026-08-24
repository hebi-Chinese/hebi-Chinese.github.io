import { expect, test } from '@playwright/test';

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
