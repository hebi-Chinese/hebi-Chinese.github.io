/** Collect font roles from built pages, not source comments or body copy.
 * Run after build, against a local `npm run preview` server.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const origin = new URL(process.argv[2]);
if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) {
  throw new Error('Use a local production preview, not the live website.');
}
const root = new URL('../', import.meta.url);
const files = await readdir(new URL('dist/', root), { recursive: true });
const routes = files.filter(file => file.endsWith('.html')).sort();
if (routes.length === 0) throw new Error('Run npm run build before collecting font usage.');
const usage = { 'Hebi Hand': new Set(), 'Hebi Pen': new Set() };
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  // Only computed font roles matter here; external services and glyph downloads do not.
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin !== origin.origin || route.request().resourceType() === 'font') {
      return route.abort();
    }
    return route.continue();
  });
  for (const file of routes) {
    // LegacyRedirect pages immediately navigate and have no site typography.
    const html = await readFile(new URL(`dist/${file}`, root), 'utf8');
    if (/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)) continue;
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(new URL(file.replace(/index\.html$/, ''), origin).href);
      if (!response?.ok()) throw new Error(`Preview failed for ${file}`);
      const text = await page.evaluate(families => {
        const collected = Object.fromEntries(families.map(family => [family, '']));
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const parent = node.parentElement;
          if (!parent || parent.closest('script, style, noscript')) continue;
          const fonts = getComputedStyle(parent).fontFamily.split(',').map(font => font.trim().replace(/['"]/g, ''));
          for (const family of families) {
            if (fonts.includes(family)) collected[family] += node.textContent;
          }
        }
        return collected;
      }, Object.keys(usage));
      for (const [family, characters] of Object.entries(text)) {
        for (const character of characters) {
          if (/[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/u.test(character)) usage[family].add(character);
        }
      }
    }
  }
} finally {
  await browser.close();
}
const manifest = Object.fromEntries(Object.entries(usage).map(([family, characters]) => [family, [...characters].sort().join('')]));
await writeFile(new URL('scripts/webfont-usage.json', root), `${JSON.stringify(manifest, null, 2)}\n`);
for (const [family, characters] of Object.entries(manifest)) console.log(`${family}: ${characters.length} characters from ${routes.length} built routes`);
