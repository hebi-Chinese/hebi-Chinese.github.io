import { expect, test, type CDPSession } from '@playwright/test';

test('font URLs identify their exact contents across rebuilds', async ({ page }) => {
  await page.goto('/');
  const assets = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const sheet of document.styleSheets) {
      if (sheet.href && new URL(sheet.href).origin !== location.origin) continue;
      for (const rule of sheet.cssRules) {
        if (!(rule instanceof CSSFontFaceRule) || !rule.style.fontFamily.includes('Hebi')) continue;
        const src = rule.style.getPropertyValue('src').match(/url\(["']?([^"')]+)["']?\)/)!;
        urls.push(new URL(src[1], sheet.href ?? location.href).href);
      }
    }
    const results = [];
    for (const url of urls) {
      const response = await fetch(url);
      const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
      results.push({ url, hash, ok: response.ok });
    }
    return results;
  });
  expect(assets.length).toBeGreaterThan(0);
  for (const { url, hash, ok } of assets) {
    expect(ok).toBe(true);
    expect(url).toMatch(new RegExp(`-${hash}\\.woff2$`));
  }
});

test('home downloads small role-specific font subsets', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const urls = await page.evaluate(() => performance.getEntriesByType('resource')
    .map(entry => entry.name).filter(url => url.includes('/fonts/hebi/') && url.endsWith('.woff2')));
  expect(urls.some(url => url.includes('/hand-'))).toBe(true);
  expect(urls.some(url => url.includes('/pen-'))).toBe(true);
  let total = 0;
  let signature = 0;
  for (const url of urls) {
    const response = await page.request.get(url);
    expect(response.ok()).toBe(true);
    const bytes = (await response.body()).length;
    total += bytes;
    if (url.includes('/pen-')) signature += bytes;
  }
  expect(signature).toBeLessThan(10 * 1024);
  expect(total).toBeLessThan(100 * 1024);
});

test('new copy automatically downloads additional glyphs without repackaging', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const before = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  await page.evaluate(() => {
    for (const family of ['Hebi Hand', 'Hebi Pen']) {
      const heading = document.createElement('h2');
      heading.dataset.fontUpdate = family;
      heading.style.fontFamily = `"${family}"`;
      heading.textContent = '龘';
      document.body.append(heading);
    }
  });
  await expect(page.locator('[data-font-update]').first()).toBeVisible();
  // Layout triggers font fetching. No document.fonts.load call: the browser must do it.
  await page.evaluate(() => document.fonts.ready);
  const after = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  for (const prefix of ['hand', 'pen']) {
    expect(after.some(url => url.includes(`/fonts/hebi/${prefix}-`)
      && !url.includes('-common-') && !before.includes(url))).toBe(true);
  }
});

test('approved Chinese fonts download without installed local fonts', async ({ page, browserName }) => {
  let cdp: CDPSession | undefined;
  if (browserName === 'chromium') {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    await cdp.send('CSS.setLocalFontsEnabled', { enabled: false });
  }
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const initialResources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  const fonts = await page.evaluate(async () => {
    // Include a rare character to exercise coverage beyond current site copy.
    const results = [];
    for (const family of ['Hebi Hand', 'Hebi Pen']) {
      const loaded = await document.fonts.load(`32px "${family}"`, '关于这个人何必龘');
      results.push({ family, count: loaded.length, loaded: loaded.every(font => font.status === 'loaded') });
    }
    return results;
  });
  for (const font of fonts) {
    expect(font.count).toBeGreaterThan(0);
    expect(font.loaded).toBe(true);
  }
  const extraResources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  for (const prefix of ['hand', 'pen']) {
    expect(extraResources.some(url => url.includes(`/fonts/hebi/${prefix}-`)
      && !url.includes('-common-') && !initialResources.includes(url))).toBe(true);
  }
  if (cdp) {
    await page.evaluate(() => {
      for (const [index, family] of ['Hebi Hand', 'Hebi Pen'].entries()) {
        const sample = document.createElement('span');
        sample.id = `font-probe-${index}`;
        sample.style.fontFamily = `"${family}"`;
        sample.textContent = '何必龘';
        document.body.append(sample);
      }
    });
    const { root } = await cdp.send('DOM.getDocument');
    for (const [index, name] of ['HannotateSC-W5', 'HanziPenSC-W3'].entries()) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `#font-probe-${index}` });
      const { fonts: rendered } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      const customGlyphs = rendered.filter(font => font.postScriptName === name && font.isCustomFont)
        .reduce((count, font) => count + font.glyphCount, 0);
      expect(customGlyphs).toBe(3);
    }
  }
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name).filter(url => url.includes('/fonts/hebi/') && url.endsWith('.woff2')));
  expect(resources.some(url => url.includes('/hand-'))).toBe(true);
  expect(resources.some(url => url.includes('/pen-'))).toBe(true);
  for (const url of resources) {
    const response = await page.request.get(url);
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0, 4).toString()).toBe('wOF2');
  }
});
