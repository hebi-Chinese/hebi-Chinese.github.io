import { expect, test } from '@playwright/test';

const projects = [
  ['Deepulse', 'https://github.com/hebi-Chinese/Deepulse'],
  ['Codex 工作看板', 'https://github.com/hebi-Chinese/codex-working-board'],
  ['MIKU for Codex', 'https://github.com/hebi-Chinese/MIKU-Codex-macOS'],
  ['CC–MiMo Bridge', 'https://github.com/hebi-Chinese/CC-mcp-mimo-bridge'],
  ['Euterpe', 'https://github.com/Euterpe-org/Euterpe'],
] as const;

for (const route of ['/', '/projects']) {
  test(`${route}: every project card opens its repository from padding and keyboard`, async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await context.route('https://github.com/**', (route) => route.fulfill({ body: 'GitHub destination' }));
    await page.goto(route);
    const status = page.getByRole('status', { name: '当前项目' });
    for (const [index, [name, url]] of projects.entries()) {
      await expect(status).toHaveText(`${String(index + 1).padStart(2, '0')} / 05 · ${name}`);
      const card = page.getByRole('link', { name: `${name}（GitHub，新标签页）`, exact: true });
      await expect(card).toHaveAttribute('href', url);
      await expect(card.getByRole('heading', { name, exact: true })).toBeVisible();
      await expect(card.getByRole('button')).toHaveCount(0);
      await card.scrollIntoViewIfNeeded();
      const popupPromise = page.waitForEvent('popup');
      // The padded corner is outside the project heading and proves the entire face is a link.
      await card.click({ position: { x: 20, y: 20 } });
      const popup = await popupPromise;
      await expect(popup).toHaveURL(url);
      await popup.close();
      await card.focus();
      await expect(card).toBeFocused();
      const keyboardPopupPromise = page.waitForEvent('popup');
      await card.press('Enter');
      const keyboardPopup = await keyboardPopupPromise;
      await expect(keyboardPopup).toHaveURL(url);
      await keyboardPopup.close();
      if (index < projects.length - 1) await page.getByRole('button', { name: '下一个项目' }).click();
    }
    await expect(page.getByRole('button', { name: /详情|摘要/ })).toHaveCount(0);
  });
}

for (const route of ['/', '/projects']) {
  test(`${route}: dragging a card rotates without opening GitHub, and the next click works`, async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await context.route('https://github.com/**', r => r.fulfill({ body: 'GitHub' }));
    await page.goto(route);
    const card = page.getByRole('link', { name: 'Deepulse（GitHub，新标签页）', exact: true });
    await card.scrollIntoViewIfNeeded();
    const bounds = await card.boundingBox();
    if (!bounds) throw new Error('Project card has no bounds');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 - 280, bounds.y + bounds.height / 2, { steps: 15 });
    await expect(page.getByRole('status', { name: '当前项目' })).not.toContainText('Deepulse');
    await page.mouse.up();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    expect(context.pages()).toHaveLength(1);
    const current = page.getByRole('link', { name: /（GitHub，新标签页）/ });
    const destination = await current.getAttribute('href');
    const popupPromise = page.waitForEvent('popup');
    await current.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(destination!);
    await popup.close();
  });

  test(`${route}: long press suppresses navigation and can continue into a drag`, async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await context.route('https://github.com/**', r => r.fulfill({ body: 'GitHub' }));
    await page.goto(route);
    const card = page.getByRole('link', { name: 'Deepulse（GitHub，新标签页）', exact: true });
    await card.scrollIntoViewIfNeeded();
    // This duration exercises the public long-press contract (400 ms), not rendering readiness.
    await card.click({ delay: 500 });
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    expect(context.pages()).toHaveLength(1);
    const bounds = await card.boundingBox();
    if (!bounds) throw new Error('Project card has no bounds');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    // Explicit hold before moving must still permit drag rotation.
    await page.waitForTimeout(500);
    await page.mouse.move(bounds.x + bounds.width / 2 - 280, bounds.y + bounds.height / 2, { steps: 15 });
    await page.mouse.up();
    await expect(page.getByRole('status', { name: '当前项目' })).not.toContainText('Deepulse');
    expect(context.pages()).toHaveLength(1);
  });
}
