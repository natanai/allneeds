import { expect, test } from './fixtures';

const remoteBootHosts = new Set([
  'backend.allneeds.app',
  'esm.sh',
  'bsky.social',
  'plc.directory',
]);

test('mounts the app beneath an opaque full-screen splash while local resources finish', async ({ page }) => {
  let delayedLocalResource = false;
  await page.route('**/data/reverse-inference.json', async (route) => {
    delayedLocalResource = true;
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    await route.continue();
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const boot = page.locator('#app-boot');
  await expect(boot).toBeVisible();
  await expect(page.locator('#root [aria-label="Primary navigation magnets"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.appState)).toBe('loading');
  await expect(page.locator('#root')).toHaveCSS('visibility', 'hidden');
  expect(delayedLocalResource).toBe(true);

  const coverage = await boot.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: document.documentElement.clientHeight,
    };
  });
  expect(coverage.top).toBe(0);
  expect(coverage.left).toBe(0);
  expect(coverage.width).toBe(coverage.viewportWidth);
  expect(coverage.height).toBe(coverage.viewportHeight);
  await expect(page.locator('.app-boot__card')).toBeVisible();
  await expect(page.locator('.app-boot__label')).toHaveText('Getting everything ready…');

  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.appState)).toBe('ready');
  await expect(page.locator('#root')).toHaveCSS('visibility', 'visible');
  await expect(boot).toHaveCount(0);
  await expect(page.locator('[aria-label="Primary navigation magnets"]')).toHaveAttribute('data-ready', 'true');
});

test('fresh startup warms only the local runtime and keeps Play on by default', async ({ page }) => {
  const remoteRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (remoteBootHosts.has(url.hostname)) remoteRequests.push(request.url());
  });

  await page.goto('/');
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.appState)).toBe('ready');

  await expect(page.locator('[aria-label="Primary navigation magnets"]')).toHaveAttribute('data-active', 'true');
  expect(remoteRequests).toEqual([]);
});

test('route and menu presentation state do not re-pack persistent nav geometry', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('magnetPositions:site-nav', JSON.stringify({
      layoutVersion: 7,
      layouts: {},
      meta: { playActive: false },
    }));
  });
  await page.goto('/');

  const board = page.locator('[aria-label="Primary navigation magnets"]');
  await expect(board).toHaveAttribute('data-ready', 'true');
  await expect(board).toHaveAttribute('data-active', 'false');

  const readCoordinates = () => board.locator('[data-magnet-id]').evaluateAll((elements) =>
    Object.fromEntries(elements.map((element) => {
      const id = element.getAttribute('data-magnet-id') ?? '';
      return [id, {
        x: (element as HTMLElement).style.getPropertyValue('--magnet-x'),
        y: (element as HTMLElement).style.getPropertyValue('--magnet-y'),
      }] as const;
    })),
  );

  const initialCoordinates = await readCoordinates();

  await page.locator('[data-magnet-id="nav-needs"]').click();
  await expect(page).toHaveURL(/\/needs\/?$/);
  await expect(board).toHaveAttribute('data-ready', 'true');
  expect(await readCoordinates()).toEqual(initialCoordinates);

  await page.locator('[data-magnet-id="nav-menu"]').click();
  await expect(page.locator('[data-magnet-id="nav-menu"]')).toHaveAttribute('aria-expanded', 'true');
  await expect(board).toHaveAttribute('data-ready', 'true');
  expect(await readCoordinates()).toEqual(initialCoordinates);
});
