import { expect, test } from '@playwright/test';

test('Markdown preserves authored prose, local images and HTML figure captions', async ({ page }) => {
  await page.goto('/essays/post-01');
  const article = page.getByRole('article');
  await expect(article).toContainText('AI 像季风,来了就回不去,没人能选要不要。');
  await expect(article.getByRole('img')).toHaveCount(3);
  await expect(article.getByRole('img', { name: 'Claude 表现', exact: true })).toHaveCount(1);
  await expect(article.getByRole('img', { name: 'mimo 表现', exact: true })).toHaveCount(1);
  await expect(article.locator('figcaption')).toHaveText(['Claude (cli)', 'mimo (desktop)']);
  for (const image of await article.getByRole('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(el => el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0)).toBe(true);
  }
});

test('Markdown note keeps all section headings, inline emphasis and timestamp', async ({ page }) => {
  await page.goto('/notes/typing-or-speaking');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    '从打字到说话', 'Typeless 先把我掰过来', '开始在意实时性以后', '我还是在 Mac 端用 Typeless',
  ]);
  await expect(page.getByRole('article').locator('strong')).toHaveText(['Typeless', '闪电说', '豆包输入法']);
  await expect(page.locator('time')).toHaveAttribute('datetime', '2026-08-12T11:30:00');
});
