import { expect, test } from '@playwright/test';

test('project controls select a card and its button reveals the details', async ({ page }) => {
  await page.goto('/projects');

  const status = page.getByRole('status', { name: '当前项目' });
  await expect(status).toHaveText('01 / 05 · Euterpe');

  const nextProjectButton = page.getByRole('button', { name: '下一个项目' });
  await nextProjectButton.focus();
  await nextProjectButton.press('Enter');
  await expect(status).toHaveText('02 / 05 · Euterpe.Bot');

  const detailsButton = page.getByRole('button', { name: /Euterpe\.Bot/ });
  await detailsButton.focus();
  await detailsButton.press('Enter');

  await expect(detailsButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Euterpe.Bot 多 Agent 系统', { exact: true })).toBeVisible();
});
