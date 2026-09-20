import { expect, test, type Page } from '@playwright/test';

// Preserve native pointer input, but control time: Linux WebKit can take seconds
// between rendered frames. API traces and failure screenshots retain diagnostics.
test.use({ trace: { mode: 'retain-on-failure', snapshots: false, screenshots: false } });

test.beforeEach(async ({ page }) => {
  await page.clock.install();
});

async function openWheel(page: Page, route: string) {
  await page.clock.resume();
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  const card = page.getByRole('link', { name: 'Deepulse（GitHub，新标签页）', exact: true });
  await card.scrollIntoViewIfNeeded();
  // Finish initial layout/reveal before measuring a gesture on the paused clock.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const bounds = (await card.boundingBox())!;
  return { card, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

async function swipe(page: Page, x: number, y: number) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  // The same 176px / 128ms gesture reaches every engine regardless of driver load.
  for (let step = 1; step <= 8; step += 1) {
    await page.mouse.move(x - step * 22, y);
    await page.clock.runFor(16);
  }
}

async function samplePath(page: Page, duration: number) {
  const positions: number[][] = [];
  const read = () => page.locator('[data-project-card]').evaluateAll(cards => cards.map(card => {
    const rect = card.getBoundingClientRect();
    return rect.x + rect.width / 2;
  }));
  // Apply the final input frame, then measure the full post-release interval.
  await page.clock.runFor(16);
  positions.push(await read());
  for (let elapsed = 0; elapsed < duration;) {
    const step = Math.min(16, duration - elapsed);
    await page.clock.runFor(step);
    elapsed += step;
    positions.push(await read());
  }
  return positions;
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
    await page.clock.runFor(120);
    await page.mouse.up();
    const initialTravel = travel(await samplePath(page, 350));
    // Require visible continuation, deceleration, then complete settling.
    expect(initialTravel).toBeGreaterThan(5);
    expect(travel(await samplePath(page, 350))).toBeLessThan(initialTravel);
    // Measure the finite coast-down contract; after 3.5 seconds no movement remains.
    await page.clock.runFor(3500);
    expect(travel(await samplePath(page, 250))).toBeLessThan(.5);
    expect(await page.evaluate(() => (window as typeof window & { __pendingFrames: number }).__pendingFrames)).toBe(0);
    expect(context.pages()).toHaveLength(1);
  });
}

test('a tiny final pointer movement does not erase the swipe, and pressing catches it', async ({ page }) => {
  const { x, y } = await openWheel(page, '/');
  await swipe(page, x, y);
  // This is inside the supported brief-release pause. Firefox rounds the final
  // 0.1px move to a whole CSS pixel; it must not replace the last swipe sample.
  await page.clock.runFor(120);
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

test('holding still before release and reduced motion both suppress coast', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const events: object[] = [];
    Object.defineProperty(window, '__wheelTiming', { value: events });
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      document.addEventListener(type, event => {
        const pointer = event as PointerEvent;
        events.push({ type, x: pointer.clientX, time: performance.now(), stamp: event.timeStamp });
      }, true);
    }
  });
  const { x, y } = await openWheel(page, '/');
  await swipe(page, x, y);
  // Holding still for 400 ms signals a deliberate stop, not a fling.
  await page.clock.runFor(400);
  await page.mouse.up();
  const positions = await samplePath(page, 200);
  const input = await page.evaluate(() => (window as typeof window & { __wheelTiming: object[] }).__wheelTiming);
  await testInfo.attach('hold-release', { body: JSON.stringify({ input, positions }), contentType: 'application/json' });
  expect(travel(positions)).toBeLessThan(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
  await page.getByLabel('3D 项目轮盘').evaluate(stage => new Promise<void>(resolve => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(stage);
  }));
  await page.clock.runFor(32);
  expect(travel(await samplePath(page, 250))).toBeLessThan(.5);
  await page.getByLabel('3D 项目轮盘').scrollIntoViewIfNeeded();
  expect(travel(await samplePath(page, 250))).toBeLessThan(.5);
});
