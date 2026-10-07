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

test('the approved creative-atmosphere note is listed in date order and preserves its authored prose and date', async ({ page }) => {
  await page.goto('/notes');
  const notes = page.getByRole('main').getByRole('list');
  const dates = await notes.locator('time').evaluateAll(times => times.map(time => time.getAttribute('datetime')!));
  expect(dates).toEqual([...dates].sort().reverse());
  const entry = notes.getByRole('link', { name: /轻松的氛围能够激发人的创作欲与分享欲/ });
  await expect(entry).toHaveAttribute('href', '/notes/creative-atmosphere');
  await expect(entry.locator('time')).toHaveText('2026/10/07');
  await entry.click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('轻松的氛围能够激发人的创作欲与分享欲');
  await expect(page.locator('time')).toHaveAttribute('datetime', '2026-10-07');
  const paragraphs = page.getByRole('article').locator('p');
  await expect(paragraphs).toHaveCount(5);
  await expect(paragraphs.first()).toContainText('平时上班工作的时候，我会在闲暇之余刷刷技术博客。');
  await expect(paragraphs.nth(3)).toContainText('无论是出于装逼、分享,还是希望大家都能共赢,总之我有了这个欲望。');
  await expect(paragraphs.last()).toContainText('那些技术大佬的执行力,还是比我厉害得多。');
});
