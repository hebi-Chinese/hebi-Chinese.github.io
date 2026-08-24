import { expect, test } from '@playwright/test';

test('mobile navigation opens from the keyboard and Escape restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: /导航/ });
  await menuButton.focus();
  await menuButton.press('Enter');

  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  const firstLink = page.getByRole('link', { name: 'about', exact: true });
  const lastLink = page.getByRole('link', { name: 'contact', exact: true });
  await expect(firstLink).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(lastLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstLink).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(menuButton).toBeFocused();
});
