import { expect, test, type Page } from '@playwright/test';

async function openWheel(page: Page, route: string) {
  await page.goto(route);
  const card = page.getByRole('link', { name: 'Deepulse（GitHub，新标签页）', exact: true });
  await card.scrollIntoViewIfNeeded();
  const bounds = (await card.boundingBox())!;
  return { card, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

async function swipe(page: Page, x: number, y: number) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  // Native pointer moves are paced by the browser. Extra driver-side sleeps
  // turned this into a slow drag under multi-browser load rather than a flick.
  await page.mouse.move(x - 176, y, { steps: 8 });
}

async function samplePath(page: Page, duration: number) {
  return page.locator('[data-project-card]').evaluateAll((cards, duration) => new Promise<number[][]>(resolve => {
    const start = performance.now();
    const positions: number[][] = [];
    const sample = () => {
      // One card can be at an orbital turning point while the rest still travels.
      positions.push(cards.map(card => {
        const rect = card.getBoundingClientRect();
        return rect.x + rect.width / 2;
      }));
      if (performance.now() - start >= duration) resolve(positions);
      else requestAnimationFrame(sample);
    };
    sample();
  }), duration);
}
const travel = (positions: number[][]) => positions.slice(1).reduce((sum, frame, i) =>
  sum + frame.reduce((distance, x, card) => distance + Math.abs(x - positions[i][card]), 0) / frame.length, 0);

for (const route of ['/', '/projects']) {
  test(`${route}: a swipe retains momentum across a brief release pause and settles`, async ({ page, context }) => {
    await page.addInitScript(() => {
      const pending = new Set<number>();
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => {
        const id = request(time => { pending.delete(id); callback(time); });
        pending.add(id);
        return id;
      };
      window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
      Object.defineProperty(window, '__pendingFrames', { get: () => pending.size });
    });
    const { x, y } = await openWheel(page, route);
    await swipe(page, x, y);
    // Brief finger-release pause must reduce momentum smoothly, not erase it at 100 ms.
    await page.waitForTimeout(120);
    await page.mouse.up();
    const initialTravel = travel(await samplePath(page, 350));
    // Native input pacing varies under browser load. Check visible continuation,
    // then deceleration and settling, rather than imposing a fixed fling speed.
    expect(initialTravel).toBeGreaterThan(5);
    expect(travel(await samplePath(page, 350))).toBeLessThan(initialTravel);
    // Measure the finite coast-down contract; after 3.5 seconds no movement remains.
    await page.waitForTimeout(3500);
    expect(travel(await samplePath(page, 250))).toBeLessThan(.5);
    expect(await page.evaluate(() => (window as typeof window & { __pendingFrames: number }).__pendingFrames)).toBe(0);
    expect(context.pages()).toHaveLength(1);
  });
}

test('a tiny final pointer movement does not erase the swipe, and pressing catches it', async ({ page }) => {
  const { x, y } = await openWheel(page, '/');
  await swipe(page, x, y);
  await page.mouse.move(x - 176.1, y);
  await page.mouse.up();
  expect(travel(await samplePath(page, 180))).toBeGreaterThan(5);
  // Grab in the empty top edge of the stage; no link activation is involved.
  const stage = (await page.getByLabel('3D 项目轮盘').boundingBox())!;
  await page.mouse.move(stage.x + stage.width / 2, stage.y + 10);
  await page.mouse.down();
  expect(travel(await samplePath(page, 200))).toBeLessThan(.5);
  await page.mouse.up();
});

test('holding still before release and reduced motion both suppress coast', async ({ page }) => {
  const { x, y } = await openWheel(page, '/');
  await swipe(page, x, y);
  // Holding still for 400 ms signals a deliberate stop, not a fling.
  await page.waitForTimeout(400);
  await page.mouse.up();
  expect(travel(await samplePath(page, 200))).toBeLessThan(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const next = await openWheel(page, '/');
  await swipe(page, next.x, next.y);
  await page.mouse.up();
  expect(travel(await samplePath(page, 200))).toBeLessThan(.5);
});


test('scrolling away stops an active coast and returning does not resume it', async ({ page }) => {
  const { x, y } = await openWheel(page, '/');
  await swipe(page, x, y);
  await page.mouse.up();
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  // Allow the visibility observer to stop momentum before measuring hidden geometry.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(travel(await samplePath(page, 250))).toBeLessThan(.5);
  await page.getByLabel('3D 项目轮盘').scrollIntoViewIfNeeded();
  expect(travel(await samplePath(page, 250))).toBeLessThan(.5);
});
