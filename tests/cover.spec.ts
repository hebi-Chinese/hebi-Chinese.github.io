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
  // Linux WebKit may deliver <2 frames/s while recording a software-rendered trace.
  // Control the browser clock to verify the 500ms contract, not the runner's FPS.
  await page.clock.install({ time: new Date('2026-09-20T00:00:00Z') });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const surface = page.getByRole('region', { name: '做过的东西' });
  await surface.getByRole('button', { name: '查看双棱镜', exact: true }).click();
  await expect(surface.locator('img').nth(1)).toHaveCSS('opacity', '0');
  await page.clock.pauseAt(new Date('2026-09-20T00:01:00Z'));
  await surface.evaluate(root => new Promise<void>(resolve => {
    const images = root.querySelectorAll('img');
    const r = images[0].getBoundingClientRect();
    // Let the native scroll event reach the surface before advancing its queued frames.
    addEventListener('scroll', () => resolve(), { once: true });
    scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight * .37, behavior: 'instant' });
  }));
  const samples: { elapsed: number; incoming: number; backing: number }[] = [];
  let elapsed = 0;
  for (const step of [16, 125, 125, 125, 125, 32]) {
    await page.clock.runFor(step);
    elapsed += step;
    const [backing, incoming] = await surface.locator('img').evaluateAll(images =>
      images.map(image => Number(getComputedStyle(image).opacity)));
    samples.push({ elapsed, incoming, backing });
  }
  await testInfo.attach('crossfade-frames', { body: JSON.stringify(samples), contentType: 'application/json' });
  expect(samples[2].incoming).toBeGreaterThan(.05);
  expect(samples[2].incoming).toBeLessThan(.95);
  expect(samples.every(sample => sample.backing === 1)).toBe(true);
  expect(samples.at(-1)!.incoming).toBe(1);
});

test('reduced motion removes the outgoing page hold', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.about-flow-hold')).toHaveCSS('position', 'relative');
  await expect(page.getByRole('heading', { name: '此刻坐标', exact: true })).toHaveCount(1);
});
