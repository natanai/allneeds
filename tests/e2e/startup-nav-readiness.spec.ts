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
    const style = getComputedStyle(element);
    return {
      position: style.position,
      top: style.top,
      right: style.right,
      bottom: style.bottom,
      left: style.left,
    };
  });
  expect(coverage).toEqual({
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  });
  await expect(page.locator('.app-boot__card')).toBeVisible();
  await expect(page.locator('.app-boot__label')).toHaveText('Getting everything ready…');

  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.appState)).toBe('ready');
  await expect(page.locator('#root')).toHaveCSS('visibility', 'visible');
  await expect(boot).toHaveCount(0);
  await expect(page.locator('[aria-label="Primary navigation magnets"]')).toHaveAttribute('data-ready', 'true');
});

test('fresh startup warms one public shared-strategy snapshot and keeps Play on by default', async ({ page }) => {
  const remoteRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (remoteBootHosts.has(url.hostname)) remoteRequests.push(request.url());
  });

  await page.goto('/');
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.appState)).toBe('ready');

  await expect(page.locator('[aria-label="Primary navigation magnets"]')).toHaveAttribute('data-active', 'true');
  expect(remoteRequests).toHaveLength(1);
  const feedRequest = new URL(remoteRequests[0]);
  expect(feedRequest.hostname).toBe('backend.allneeds.app');
  expect(feedRequest.pathname).toBe('/api/strategies/feed');
  expect(Object.fromEntries(feedRequest.searchParams)).toEqual({
    scope: 'public',
    sort: 'recent',
    limit: '100',
  });
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

test('standalone emotion wheel cannot collapse or rewrite persistent nav geometry', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('magnetPositions:site-nav', JSON.stringify({
      layoutVersion: 7,
      layouts: {},
      meta: { playActive: true },
    }));
  });
  await page.goto('/feelings');

  let board = page.locator('[aria-label="Primary navigation magnets"]');
  await expect(board).toHaveAttribute('data-ready', 'true');
  await expect(board).toHaveAttribute('data-active', 'true');

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

  await page.getByRole('link', { name: 'Open interactive emotions wheel' }).click();
  await expect(page).toHaveURL(/\/feelings\/emotions-wheel\/?$/);
  await expect(page.locator('[aria-label="Primary navigation magnets"]')).toHaveCount(0);

  // Keep the wheel open long enough that the previous hidden 0×0 Play board
  // would have collapsed and later persisted the navigation at the origin.
  await page.waitForTimeout(500);
  await page.getByRole('link', { name: 'Joyful' }).click();
  await expect(page).toHaveURL(/\/feelings\/joyful\/?$/);

  board = page.locator('[aria-label="Primary navigation magnets"]');
  await expect(board).toHaveAttribute('data-ready', 'true');
  expect(await readCoordinates()).toEqual(initialCoordinates);
});
