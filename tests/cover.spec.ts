import { expect, test } from '@playwright/test';

test('the third sheet covers a stationary second page with a single bookmark', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const sheet = page.getByRole('region', { name: '做过的东西' });
  const about = page.getByRole('heading', { name: '关于这个人', exact: true });
  const place = async (fraction: number) => {
    await sheet.evaluate((el, f) => scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * f, behavior: 'instant' }), fraction);
    await expect.poll(async () => (await sheet.boundingBox())!.y).toBeCloseTo(900 * fraction, 0);
    // The prior Hero→About tilt is delivered on the next animation frame.
    // Compare cover positions only once the outgoing page is visibly flat.
    await expect.poll(() => page.locator('.about-flow-panel').evaluate(el => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.abs(Math.atan2(m.m23, m.m22));
    })).toBeLessThan(.001);
  };
  await place(.7);
  const previous = await about.boundingBox();
  await place(.3);
  const next = await about.boundingBox();
  expect(Math.abs(next!.y - previous!.y)).toBeLessThan(5);
  await expect(sheet.getByText('WORK / 03', { exact: true })).toHaveCount(1);
  await sheet.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top + 60, behavior: 'instant' }));
  await expect(about).toHaveCount(0);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(about).toHaveCount(1);
});

test('a fast scroll produces intermediate image frames without exposing the paper', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const surface = page.getByRole('region', { name: '做过的东西' });
  await surface.getByRole('button', { name: '查看双棱镜', exact: true }).click();
  await expect(surface.locator('img').nth(1)).toHaveCSS('opacity', '0');
  const samples = await surface.evaluate(async root => {
    const images = root.querySelectorAll('img');
    const r = images[0].getBoundingClientRect();
    scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight * .37, behavior: 'instant' });
    const start = performance.now();
    const result: { elapsed: number; wallElapsed: number; incoming: number; backing: number; top: number; height: number; scroll: number }[] = [];
    // Sample the public 500ms transition over 800ms, not an arbitrary synchronization sleep.
    await new Promise<void>(resolve => {
      function sample(now: number) {
        const rect = images[0].getBoundingClientRect();
        result.push({ elapsed: now - start, wallElapsed: performance.now() - start,
          incoming: Number(getComputedStyle(images[1]).opacity), backing: Number(getComputedStyle(images[0]).opacity),
          top: rect.top, height: rect.height, scroll: scrollY });
        if (now - start < 800) requestAnimationFrame(sample); else resolve();
      }
      requestAnimationFrame(sample);
    });
    return result;
  });
  await testInfo.attach('crossfade-frames', { body: JSON.stringify(samples), contentType: 'application/json' });
  expect(samples.some(sample => sample.incoming > .05 && sample.incoming < .95)).toBe(true);
  expect(samples.every(sample => sample.backing === 1)).toBe(true);
  expect(samples.at(-1)!.incoming).toBe(1);
});

test('reduced motion removes the outgoing page hold', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.about-flow-hold')).toHaveCSS('position', 'relative');
  await expect(page.getByRole('heading', { name: '此刻坐标', exact: true })).toHaveCount(1);
});
