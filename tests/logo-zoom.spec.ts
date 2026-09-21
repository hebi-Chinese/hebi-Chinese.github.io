import { expect, test } from '@playwright/test';

declare global { interface Window { requestedFrames: number; } }

test('the bulge settles without continuously requesting animation frames', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame;
    window.requestedFrames = 0;
    window.requestAnimationFrame = (callback) => {
      window.requestedFrames += 1;
      return original.call(window, callback);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: '放大查看何必 Logo' }).hover();
  // Browser frame rates vary under parallel load. Require a sustained idle window
  // after convergence, rather than assuming 1.8 seconds always supplies enough frames.
  await expect.poll(() => page.evaluate(async () => {
    const before = window.requestedFrames;
    await new Promise(resolve => setTimeout(resolve, 350));
    return window.requestedFrames - before;
  }), { timeout: 6000 }).toBe(0);
});

test('the actual logo stroke expands locally and restores on leave', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const button = page.getByRole('button', { name: '放大查看何必 Logo' });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  const canvas = button.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = (await button.boundingBox())!;
  // Sample the visible left vertical at SVG (251, 412), away from the diagonal.
  const strokeWidth = () => canvas.evaluate((surface: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = surface.width; copy.height = surface.height;
    const ctx = copy.getContext('2d')!;
    ctx.drawImage(surface, 0, 0);
    const x = Math.round(copy.width * (.2 + .224) / 1.4);
    const y = Math.round(copy.height * (.2 * 460 / 406 + .60) / (1 + .4 * 460 / 406));
    const pixels = ctx.getImageData(0, y, copy.width, 1).data;
    let left = x, right = x;
    while (left > 0 && pixels[left * 4 + 3] > 128) left--;
    while (right < copy.width - 1 && pixels[right * 4 + 3] > 128) right++;
    return right - left;
  });
  const before = await strokeWidth();
  expect(before).toBeGreaterThan(8);
  await button.hover({ position: { x: box.width * .224, y: box.height * .60 } });
  await expect.poll(strokeWidth).toBeGreaterThan(before * 1.5);
  await button.hover({ position: { x: box.width * .8, y: box.height * .3 } });
  await expect.poll(strokeWidth).toBe(before);
  await page.mouse.move(1, 1);
  await expect.poll(strokeWidth).toBe(before);
});

test('keyboard zoom supports arrows and Escape with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const button = page.getByRole('button', { name: '放大查看何必 Logo' });
  const canvas = button.locator('canvas');
  await expect(button).toBeEnabled();
  await button.focus();
  await button.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  const picture = () => canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
  const before = await picture();
  await button.press('ArrowRight');
  await expect.poll(picture).not.toBe(before);
  await button.press('Escape');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('touch can open and close zoom without page overflow', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 375, height: 812 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const button = page.getByRole('button', { name: '放大查看何必 Logo' });
  await button.tap();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await button.tap();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await context.close();
});

test('unavailable WebGL leaves the original logo readable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: unknown) {
      if (kind === 'webgl') return null;
      return original.call(this, kind, options);
    } as typeof original;
  });
  await page.goto('/');
  const button = page.getByRole('button', { name: '放大查看何必 Logo' });
  await expect(button).toBeDisabled();
  await expect(button.locator('img')).toHaveCSS('opacity', '1');
  await expect(button.locator('canvas')).toHaveCSS('opacity', '0');
});

test('lost GPU context restores the static logo', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: '放大查看何必 Logo' });
  await expect(button).toBeEnabled();
  await button.hover();
  await expect(button.locator('canvas')).toHaveCSS('opacity', '1');
  await button.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext('webgl')!.getExtension('WEBGL_lose_context')!.loseContext();
  });
  await expect(button).toBeDisabled();
  await expect(button.locator('img')).toHaveCSS('opacity', '1');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});
