import { expect, test } from '@playwright/test';

test('the tall tilted About sheet stays in front of its perspective camera', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('[data-profile-path] path').first()).toHaveAttribute('d', /^M /);
  const projection = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('[data-about-flow-stage]')!;
    const panel = document.querySelector<HTMLElement>('.about-flow-panel')!;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(panel).transform);
    return { depth: panel.offsetHeight * Math.abs(matrix.m23), perspective: parseFloat(getComputedStyle(stage).perspective) };
  });
  expect(projection.depth).toBeLessThan(projection.perspective);
});

test('About presents the approved 80px title and alternating 240px text groups', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#about');
  const about = page.locator('[data-profile-surface]');
  await expect(about.getByRole('heading', { name: '关于这个人', exact: true })).toHaveCSS('font-size', '80px');
  const groups = await about.locator('[data-profile-key]').evaluateAll(rows => rows.map(row => {
    const title = row.querySelector('h3')!.getBoundingClientRect();
    const copy = row.querySelector('p')!.getBoundingClientRect();
    return { height: (row as HTMLElement).offsetHeight, titleX: title.x, copyX: copy.x };
  }));
  expect(groups).toHaveLength(6);
  expect(groups.every(row => row.height === 240 && Math.abs(row.titleX - row.copyX) < 1)).toBe(true);
  expect(groups[1].titleX).toBeGreaterThan(groups[0].titleX + 200);
});

test('About line advances monotonically and finishes before the third sheet arrives', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('[data-profile-path] path').first()).toHaveAttribute('d', /^M /);
  await page.evaluate(() => document.fonts.ready);
  const result = await page.evaluate(async () => {
    const sheet = document.querySelector('.cover-sheet')!;
    const path = document.querySelector<SVGPathElement>('[data-thread-progress]')!;
    const clip = document.querySelector<SVGRectElement>('[data-thread-clip]')!;
    const end = scrollY + sheet.getBoundingClientRect().top - innerHeight - 64;
    const samples: number[] = [];
    // Observe rendered scroll-driven frames at successive positions, not internal helpers.
    for (const top of [0, end * .3, end * .6, end * .85, end]) {
      scrollTo({ top, behavior: 'instant' });
      for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
      samples.push(clip.height.baseVal.value);
    }
    const bounds = path.getBBox();
    return { samples, lineEnd: bounds.y + bounds.height, sheetTop: sheet.getBoundingClientRect().top, viewport: innerHeight };
  });
  expect(result.samples.every((value, index) => index === 0 || value >= result.samples[index - 1] - 1)).toBe(true);
  expect(result.samples.at(-1)).toBeGreaterThanOrEqual(result.lineEnd);
  expect(result.sheetTop).toBeGreaterThan(result.viewport);
});

test('About keeps all text visible with reduced motion and no JavaScript', async ({ browser, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#about');
  await expect(page.locator('[data-profile-path] path').first()).toHaveAttribute('d', /^M /);
  const drawing = await page.evaluate(() => {
    const path = document.querySelector<SVGPathElement>('[data-thread-progress]')!.getBBox();
    return { end: path.y + path.height, drawn: document.querySelector<SVGRectElement>('[data-thread-clip]')!.height.baseVal.value };
  });
  expect(drawing.drawn).toBeGreaterThanOrEqual(drawing.end);
  for (const text of await page.locator('[data-profile-surface] p').all()) await expect(text).toHaveCSS('opacity', '1');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto('/#about');
  await expect(plain.locator('[data-profile-glyph]')).toHaveCount(6);
  for (const glyph of await plain.locator('[data-profile-glyph]').all()) await expect(glyph).toBeVisible();
  for (const text of await plain.locator('[data-profile-key] p').all()) await expect(text).toBeVisible();
  await context.close();
});
