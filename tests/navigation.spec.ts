import { expect, test } from '@playwright/test';

test('landscape menu scrolls every link clear of the fixed header', async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto('/');
  const button = page.getByRole('button', { name: '打开导航' });
  await button.click();
  const menu = page.locator('[data-navigation-menu]');
  const first = menu.getByRole('link', { name: 'about', exact: true });
  const last = menu.getByRole('link', { name: 'contact', exact: true });
  const header = page.getByRole('navigation', { name: '主导航', exact: true });
  const headerBottom = await header.evaluate(el => el.getBoundingClientRect().bottom);
  await expect(first).toBeInViewport({ ratio: 1 });
  expect((await first.boundingBox())!.y).toBeGreaterThanOrEqual(headerBottom);
  await menu.hover();
  await page.mouse.wheel(0, 700);
  await expect(last).toBeInViewport({ ratio: 1 });
  await page.mouse.wheel(0, -700);
  await expect(first).toBeInViewport({ ratio: 1 });
  await first.click();
  await expect(page).toHaveURL(/\/#about$/);
  await expect(page.getByRole('heading', { name: '关于这个人', exact: true })).toBeFocused();
});

test('mobile navigation opens from the keyboard and Escape restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: /导航/ });
  await menuButton.focus();
  await menuButton.press('Enter');

  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  const mobileMenu = page.locator('[id^="site-navigation-menu"]');
  const firstLink = mobileMenu.getByRole('link', { name: 'about', exact: true });
  const lastLink = mobileMenu.getByRole('link', { name: 'contact', exact: true });
  await expect(firstLink).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(lastLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstLink).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(menuButton).toBeFocused();
});
