import { expect, test } from '@playwright/test';

test('diagnostic: headed windows retain independent native hover', async ({ page }, testInfo) => {
  const x = testInfo.parallelIndex % 2 ? 700 : 100;
  await page.setContent(`<style>button {position:absolute;left:${x}px;top:100px;width:100px;height:100px}button:hover {opacity:0.5}</style><button>hover target</button>`);
  const target = page.getByRole('button', { name: 'hover target' });
  await target.hover();
  // Native hover must persist while the other worker opens or moves its own window.
  await page.waitForTimeout(1000);
  await expect(target).toHaveCSS('opacity', '0.5');
});

test('diagnostic: stationary pointer across reload still activates the logo', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const entries: unknown[] = [];
    (window as typeof window & { logoDiagnostics: unknown[] }).logoDiagnostics = entries;
    for (const type of ['pointermove', 'pointerenter', 'pointerleave', 'blur', 'focus', 'visibilitychange']) {
      document.addEventListener(type, event => {
        const target = event.target as Element;
        entries.push({ type, at: performance.now(), target: target.tagName, logo: !!target.closest?.('[data-logo-zoom]'), hidden: document.hidden });
      }, true);
    }
    const media = matchMedia('(hover: hover) and (pointer: fine)');
    media.addEventListener('change', () => entries.push({ type: 'media', matches: media.matches }));
  });
  await page.goto('/');
  const button = page.getByRole('button', { name: '放大查看何必 Logo' });
  await expect(button).toBeEnabled();
  await button.hover();
  await expect(button.locator('canvas')).toHaveCSS('opacity', '1');
  await page.reload();
  await expect(button).toBeEnabled();
  await button.hover();
  await testInfo.attach('input-events', { body: JSON.stringify(await page.evaluate(() => (window as typeof window & { logoDiagnostics: unknown[] }).logoDiagnostics)), contentType: 'application/json' });
  await expect(button.locator('canvas')).toHaveCSS('opacity', '1');
});
