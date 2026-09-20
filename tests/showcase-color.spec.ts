import { expect, test } from '@playwright/test';

for (const width of [375, 1440]) {
  test(`third-page paper and bookmark share the site warm white at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const background = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(background).toBe('rgb(250, 248, 244)');
    const sheet = page.getByRole('region', { name: '做过的东西' });
    await expect(sheet).toHaveCSS('background-color', background);
    await expect(sheet.locator('.showcase-bookmark')).toHaveCSS('background-color', background);
  });
}
