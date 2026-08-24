import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

type Position = { x: number; y: number };

function collectRuntimeProblems(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  return problems;
}

async function relativePosition(board: Locator, magnet: Locator): Promise<Position> {
  await expect(board).toHaveAttribute('data-ready', 'true');
  return magnet.evaluate((element) => ({
    x: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-x')),
    y: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-y')),
  }));
}

function positionDistance(first: Position, second: Position) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

async function expectPositionNear(
  board: Locator,
  magnet: Locator,
  expected: Position,
  tolerance = 2,
) {
  await expect.poll(async () => {
    const current = await relativePosition(board, magnet);
    return positionDistance(current, expected);
  }).toBeLessThanOrEqual(tolerance);
}

async function dragMagnetBy(page: Page, board: Locator, magnet: Locator, dx: number, dy: number) {
  const boardBox = await board.boundingBox();
  const magnetBox = await magnet.boundingBox();
  expect(boardBox).not.toBeNull();
  expect(magnetBox).not.toBeNull();

  const startX = magnetBox!.x + magnetBox!.width / 2;
  const startY = magnetBox!.y + magnetBox!.height / 2;
  const targetX = Math.min(
    boardBox!.x + boardBox!.width - magnetBox!.width / 2 - 4,
    Math.max(boardBox!.x + magnetBox!.width / 2 + 4, startX + dx),
  );
  const targetY = Math.min(
    boardBox!.y + boardBox!.height - magnetBox!.height / 2 - 4,
    Math.max(boardBox!.y + magnetBox!.height / 2 + 4, startY + dy),
  );

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 1; step <= 14; step += 1) {
    const progress = step / 14;
    await page.mouse.move(
      startX + (targetX - startX) * progress,
      startY + (targetY - startY) * progress,
    );
    await page.waitForTimeout(18);
  }
  await page.waitForTimeout(160);
  await page.mouse.up();
  await expect(magnet).not.toHaveAttribute('data-dragging', 'true');
  await page.waitForTimeout(1_400);
}

test('saved customizer colors and roundness are applied before the React bundle loads', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('nvcApp.theme', JSON.stringify({
      values: { plum: '#0A1234', lavender: '#DDEEFF', ink: '#101820', inkSoft: '#334455', rose: '#FFEECC', mint: '#77CCAA', gold: '#EEAA22', sky: '#77AADD', outline: '#222244' },
      roundness: 150,
      preset: 'First paint proof',
      updatedAt: 20,
    }));
    window.sessionStorage.setItem('nvcApp.theme', JSON.stringify({
      values: { plum: '#445566' },
      roundness: 25,
      updatedAt: 10,
    }));
  });
  await page.route('**/assets/index-*.js', (route) => route.abort());

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme-preapplied', 'true');
  await expect(page.locator('.app-boot')).toBeVisible();
  await expect.poll(() => root.evaluate((element) => element.style.getPropertyValue('--plum'))).toBe('#0A1234');
  await expect.poll(() => root.evaluate((element) => element.style.getPropertyValue('--corner-scale'))).toBe('1.5');
  await expect(page.locator('.app-boot')).toHaveCSS('color', 'rgb(16, 24, 32)');
});

test('saved customizer settings survive reload without opening the customizer', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.addInitScript(() => {
    if (window.localStorage.getItem('nvcApp.theme')) return;
    window.localStorage.setItem('nvcApp.theme', JSON.stringify({
      values: { plum: '#123456', lavender: '#E4EDFA', rose: '#FFEEDD' },
      roundness: 135,
      preset: 'Holographic',
      updatedAt: 100,
    }));
  });

  await page.goto('/needs');
  await expect(page.getByRole('dialog', { name: 'Customizer' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--plum').trim())).toBe('#123456');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--corner-scale').trim())).toBe('1.35');
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Customizer' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--plum').trim())).toBe('#123456');

  await page.getByLabel('Primary navigation magnets').getByRole('button', { name: 'Customizer' }).click();
  const customizer = page.getByRole('dialog', { name: 'Customizer' });
  await expect(customizer.getByRole('textbox', { name: 'Canvas glow' })).toHaveValue('#123456');
  await expect(customizer.getByLabel('Presets')).toHaveValue('Holographic');

  const tiltSwitch = customizer.getByRole('switch');
  const tiltCapability = await page.evaluate(() => {
    const orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: unknown };
    return { available: typeof orientation !== 'undefined', permissionRequired: typeof orientation?.requestPermission === 'function' };
  });
  if (!tiltCapability.available) {
    await expect(tiltSwitch).toHaveText('Unavailable');
    await expect(tiltSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(tiltSwitch).toBeDisabled();
  } else if (!tiltCapability.permissionRequired) {
    await expect(tiltSwitch).toHaveText('On');
    await expect(tiltSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(tiltSwitch).toBeDisabled();
  } else {
    await expect(tiltSwitch).toHaveText('Request permission');
    await expect(tiltSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(tiltSwitch).toBeEnabled();
  }
  expect(runtimeProblems).toEqual([]);
});

test('Journal History keeps long entries compact and puts feeling ratings first', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  const fullReflection = Array.from({ length: 90 }, (_, index) => `reflection${index + 1}`).join(' ');
  const preview = `${Array.from({ length: 55 }, (_, index) => `reflection${index + 1}`).join(' ')}…`;
  await page.addInitScript(({ reflection }) => {
    window.localStorage.setItem('allneeds.v2.journal', JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-08-24T05:00:00.000Z',
      data: {
        entries: [{
          id: 'long-history-entry',
          dateISO: '2026-08-24T05:00:00.000Z',
          emotion: 'Relieved, Tender',
          intensity: 7,
          feelings: [{ feeling: 'Relieved', intensity: 7 }, { feeling: 'Tender', intensity: 4 }],
          needs: ['autonomy'],
          tags: ['weekend'],
          notes: reflection,
          sensations: [],
          strategies: [],
          source: 'journal',
        }],
      },
    }));
  }, { reflection: fullReflection });

  await page.goto('/inventory/journal');
  await expect(page.getByRole('heading', { level: 3, name: 'Relieved 7/10 · Tender 4/10' })).toBeVisible();
  await expect(page.getByText(preview, { exact: true })).toBeVisible();
  await expect(page.getByText(fullReflection, { exact: true })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Autonomy', exact: true })).toHaveAttribute('href', '/needs/autonomy');
  await expect(page.getByText('#weekend', { exact: true })).toBeVisible();
  const historyFilters = page.getByLabel('Filter journal history');
  await expect(historyFilters.getByLabel('Feeling', { exact: true })).toHaveValue('');
  await expect(historyFilters.getByLabel('Need', { exact: true })).toHaveValue('');
  await expect(historyFilters.getByLabel('Tag', { exact: true })).toHaveValue('');

  await page.getByText('Read full entry', { exact: true }).click();
  await expect(page.getByText(fullReflection, { exact: true })).toBeVisible();
  await expect(page.getByText('Show less', { exact: true })).toBeVisible();
  await page.getByText('Show less', { exact: true }).click();
  await expect(page.getByText(fullReflection, { exact: true })).toBeHidden();
  expect(runtimeProblems).toEqual([]);
});

test('Bluesky account and profile paths are actionable instead of placeholder controls', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'allneeds.app menu' });
  await menu.getByRole('button', { name: /Account & data/ }).click();
  const accountHeading = menu.getByRole('heading', { name: 'Account & data', level: 2 });
  await expect(accountHeading).toBeVisible();
  const menuBox = await menu.boundingBox();
  const accountHeadingBox = await accountHeading.boundingBox();
  expect(menuBox).not.toBeNull();
  expect(accountHeadingBox).not.toBeNull();
  expect(accountHeadingBox!.y).toBeGreaterThanOrEqual(menuBox!.y);
  expect(accountHeadingBox!.y + accountHeadingBox!.height).toBeLessThanOrEqual(menuBox!.y + menuBox!.height);
  const handle = menu.getByLabel('Bluesky handle');
  const signIn = menu.getByRole('button', { name: 'Sign in', exact: true });
  await expect(handle).toBeEnabled();
  await expect(signIn).toBeDisabled();
  await handle.fill('name');
  await expect(signIn).toBeEnabled();
  await signIn.click();
  await expect(menu.getByRole('status')).toHaveText('Bluesky handles must include a domain (for example: yourname.bsky.social).');
  await handle.fill('nathanael.ink');
  await expect(signIn).toBeEnabled();
  await expect(menu.getByRole('button', { name: 'Save this browser' })).toBeDisabled();
  await expect(menu.getByRole('button', { name: 'Load saved profile' })).toBeDisabled();
  expect(runtimeProblems).toEqual([]);
});

test('a restored Bluesky session unlocks profile visibility and follower feeds', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.addInitScript(() => {
    (window as typeof window & { allneedsSession?: { did: string; handle: string } }).allneedsSession = {
      did: 'did:plc:allneeds-browser-test',
      handle: 'nathanael.ink',
    };
  });

  await page.goto('/inventory');
  await page.getByText('Add a personal strategy', { exact: true }).click();
  const form = page.locator('#inventory-form');
  await expect(form.getByRole('option', { name: 'Followers (Bluesky followers when synced)' })).toBeEnabled();
  await expect(form.getByRole('option', { name: 'Public', exact: true })).toBeEnabled();
  await expect(form.getByRole('button', { name: 'Profile', exact: true })).toBeEnabled();

  await page.goto('/feed');
  await expect(page.getByRole('option', { name: 'From people you follow' })).toBeEnabled();
  await expect(page.getByText('Following feed available for @nathanael.ink.', { exact: true })).toBeVisible();
  expect(runtimeProblems).toEqual([]);
});

test('first paint never exposes an upper-left magnet pile', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.addInitScript(() => {
    type PaintAudit = {
      visibleFrames: number;
      visibleOriginPile: boolean;
      worstOriginCount: number;
    };
    const targetWindow = window as typeof window & { __allneedsMagnetPaintAudit?: PaintAudit };
    targetWindow.__allneedsMagnetPaintAudit = {
      visibleFrames: 0,
      visibleOriginPile: false,
      worstOriginCount: 0,
    };
    const startedAt = performance.now();
    const sample = () => {
      const audit = targetWindow.__allneedsMagnetPaintAudit!;
      document.querySelectorAll<HTMLElement>('[aria-label="Primary navigation magnets"], [aria-label$="magnet board"]')
        .forEach((board) => {
          const boardBox = board.getBoundingClientRect();
          const visibleMagnets = [...board.querySelectorAll<HTMLElement>('[data-magnet-id]')]
            .filter((magnet) => {
              const style = getComputedStyle(magnet);
              const box = magnet.getBoundingClientRect();
              return style.visibility !== 'hidden'
                && style.display !== 'none'
                && Number(style.opacity || 1) > 0
                && box.width > 0
                && box.height > 0;
            });
          if (!visibleMagnets.length) return;
          audit.visibleFrames += 1;
          const originCount = visibleMagnets.filter((magnet) => {
            const box = magnet.getBoundingClientRect();
            return Math.abs(box.left - boardBox.left) <= 4
              && Math.abs(box.top - boardBox.top) <= 4;
          }).length;
          audit.worstOriginCount = Math.max(audit.worstOriginCount, originCount);
          if (originCount >= 2) audit.visibleOriginPile = true;
        });
      if (performance.now() - startedAt < 5_000) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  await page.goto('/?diagnostics=1');
  await expect(page.locator('html')).toHaveAttribute('data-app-state', 'ready');
  await expect(page.getByLabel('Primary navigation magnets')).toHaveAttribute('data-ready', 'true');
  await page.waitForTimeout(250);

  const audit = await page.evaluate(() => (
    window as typeof window & {
      __allneedsMagnetPaintAudit?: {
        visibleFrames: number;
        visibleOriginPile: boolean;
        worstOriginCount: number;
      };
    }
  ).__allneedsMagnetPaintAudit);
  expect(audit?.visibleFrames).toBeGreaterThan(0);
  expect(audit?.visibleOriginPile).toBe(false);
  expect(audit?.worstOriginCount).toBeLessThan(2);

  const appReadyMs = await expect.poll(async () => {
    const serialized = await page.locator('html').getAttribute('data-ux-metrics');
    return serialized ? (JSON.parse(serialized) as { appReadyMs: number | null }).appReadyMs : null;
  }).not.toBeNull();
  const metrics = JSON.parse((await page.locator('html').getAttribute('data-ux-metrics'))!);
  expect(metrics.appReadyMs).toBeLessThanOrEqual(3_500);
  expect(runtimeProblems).toEqual([]);
  void appReadyMs;
});

test('warm primary routes render directly without replacement loaders', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/?diagnostics=1');
  const nav = page.getByLabel('Primary navigation magnets');
  await expect(nav).toHaveAttribute('data-ready', 'true');

  const followRoute = async (name: string, path: string, mainLabel: string) => {
    await nav.getByRole('link', { name, exact: name !== 'Inventory' }).click();
    await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('main')).toHaveAttribute('aria-label', mainLabel);
    await expect(page.getByText('Loading page…', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Loading guide…', { exact: true })).toHaveCount(0);
    const routeMs = await expect.poll(async () => {
      const serialized = await page.locator('html').getAttribute('data-ux-metrics');
      return serialized ? (JSON.parse(serialized) as { lastRouteResponseMs: number | null }).lastRouteResponseMs : null;
    }).not.toBeNull();
    void routeMs;
    const serialized = await page.locator('html').getAttribute('data-ux-metrics');
    expect((JSON.parse(serialized!) as { lastRouteResponseMs: number }).lastRouteResponseMs).toBeLessThan(250);
  };

  await followRoute('Feelings', '/feelings', 'Feelings');
  await page.getByRole('link', { name: 'Open body cues page' }).click();
  await expect(page).toHaveURL(/\/feelings\/body-cues$/);
  await expect(page.locator('main')).toHaveAttribute('aria-label', 'Body cues');
  await expect(page.getByText('Loading body-cue matches…', { exact: true })).toHaveCount(0);
  await followRoute('Needs', '/needs', 'Needs');
  await followRoute('Observations', '/observations', 'Observations');
  await followRoute('Inventory', '/inventory', 'Inventory');
  expect(runtimeProblems).toEqual([]);
});

test('content magnet locations survive reload and stay independent across viewport classes', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/feelings');
  const board = page.getByLabel('Feelings magnet board');
  await expect(board).toHaveAttribute('data-ready', 'true');
  const playToggle = board.getByRole('switch');
  await playToggle.press('Space');
  await expect(playToggle).toBeChecked();

  const magnet = board.locator('[data-magnet-id]').first();
  const wideBoardWidth = (await board.boundingBox())!.width;
  const wideInitial = await relativePosition(board, magnet);
  await dragMagnetBy(page, board, magnet, 110, 82);
  const wideArranged = await relativePosition(board, magnet);
  expect(positionDistance(wideInitial, wideArranged)).toBeGreaterThan(24);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await board.boundingBox())?.width ?? 999).toBeLessThan(390);
  await page.waitForTimeout(150);
  const compactInitial = await relativePosition(board, magnet);
  await dragMagnetBy(page, board, magnet, 58, 96);
  const compactArranged = await relativePosition(board, magnet);
  expect(positionDistance(compactInitial, compactArranged)).toBeGreaterThan(20);

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(async () => (await board.boundingBox())?.width ?? 0).toBeGreaterThan(wideBoardWidth - 2);
  await expectPositionNear(board, magnet, wideArranged);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await board.boundingBox())?.width ?? 999).toBeLessThan(390);
  await expectPositionNear(board, magnet, compactArranged);

  await page.reload();
  await expect(board).toHaveAttribute('data-ready', 'true');
  await expect(playToggle).toBeChecked();
  await expectPositionNear(board, magnet, compactArranged);
  expect(runtimeProblems).toEqual([]);
});

test('a lifted magnet passes over its neighbors before the drop restores contact', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/feelings');
  const board = page.getByLabel('Feelings magnet board');
  await expect(board).toHaveAttribute('data-ready', 'true');
  const playToggle = board.getByRole('switch');
  await playToggle.press('Space');
  await expect(playToggle).toBeChecked();

  const lifted = board.locator('[data-magnet-id]').first();
  const underneath = board.locator('[data-magnet-id]').nth(5);
  const liftedBox = await lifted.boundingBox();
  const underneathBox = await underneath.boundingBox();
  expect(liftedBox).not.toBeNull();
  expect(underneathBox).not.toBeNull();
  const underneathBefore = await relativePosition(board, underneath);

  const startX = liftedBox!.x + liftedBox!.width / 2;
  const startY = liftedBox!.y + liftedBox!.height / 2;
  const targetX = underneathBox!.x + underneathBox!.width / 2;
  const targetY = underneathBox!.y + underneathBox!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 1; step <= 16; step += 1) {
    const progress = step / 16;
    await page.mouse.move(
      startX + (targetX - startX) * progress,
      startY + (targetY - startY) * progress,
    );
    await page.waitForTimeout(28);
  }
  await expect(lifted).toHaveAttribute('data-picked-up', 'true');
  const underneathWhileHeld = await relativePosition(board, underneath);
  expect(positionDistance(underneathBefore, underneathWhileHeld)).toBeLessThan(5);

  await page.waitForTimeout(180);
  await page.mouse.up();
  await expect(lifted).not.toHaveAttribute('data-picked-up', 'true');
  await page.waitForTimeout(900);
  const underneathAfterDrop = await relativePosition(board, underneath);
  const dropResponse = positionDistance(underneathWhileHeld, underneathAfterDrop);
  expect(dropResponse).toBeGreaterThan(2);
  expect(dropResponse).toBeLessThan(50);
  expect(runtimeProblems).toEqual([]);
});

test('modal surfaces own keyboard focus and restore it on Escape', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/observations');
  const helpTrigger = page.getByRole('button', { name: 'Observation basics' });
  await helpTrigger.click();
  const helpDialog = page.getByRole('dialog', { name: 'Observation help' });
  const closeHelp = helpDialog.getByRole('button', { name: 'Close observation help' });
  await expect(helpDialog).toBeVisible();
  await expect(closeHelp).toBeFocused();
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Shift+Tab');
  expect(await helpDialog.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(helpDialog).toHaveCount(0);
  await expect(helpTrigger).toBeFocused();
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('');

  await page.goto('/inventory/journal?compose=new');
  const journalDialog = page.getByRole('dialog', { name: 'Journal' });
  const reflection = journalDialog.getByLabel('Reflection');
  await expect(journalDialog).toBeVisible();
  await expect(reflection).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await journalDialog.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(journalDialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/inventory\/journal$/);
  await expect(page.locator('main')).toHaveAttribute('aria-label', 'Journal history');
  expect(runtimeProblems).toEqual([]);
});

test('the precached production shell serves deep routes while offline', async ({ page, context }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/?diagnostics=1');
  await expect(page.locator('html')).toHaveAttribute('data-offline-cache', 'ready', { timeout: 15_000 });

  await page.goto('/needs/autonomy');
  await expect(page.locator('main')).toHaveAttribute('aria-label', 'Need for autonomy');
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toHaveAttribute('aria-label', 'Need for autonomy');
    await page.goto('/observations', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toHaveAttribute('aria-label', 'Observations');
    await expect(page.getByRole('heading', { name: 'Observations', level: 1 })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
  expect(runtimeProblems).toEqual([]);
});

test.describe('mobile native-shell contracts', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Play mode keeps a touch drag on the magnet instead of scrolling the page', async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto('/feelings');
    const board = page.getByLabel('Feelings magnet board');
    await expect(board).toHaveAttribute('data-ready', 'true');
    const playToggle = board.getByRole('switch');
    await playToggle.press('Space');
    await expect(playToggle).toBeChecked();

    const magnet = board.locator('[data-magnet-id]').nth(10);
    await magnet.scrollIntoViewIfNeeded();
    await expect(magnet).toHaveCSS('touch-action', 'none');
    const before = await relativePosition(board, magnet);
    const magnetBox = await magnet.boundingBox();
    const boardBox = await board.boundingBox();
    expect(magnetBox).not.toBeNull();
    expect(boardBox).not.toBeNull();

    const startX = magnetBox!.x + magnetBox!.width / 2;
    const startY = magnetBox!.y + magnetBox!.height / 2;
    const direction = startY > 150 ? -1 : 1;
    const targetY = Math.min(
      boardBox!.y + boardBox!.height - magnetBox!.height / 2 - 6,
      Math.max(boardBox!.y + magnetBox!.height / 2 + 6, startY + direction * 72),
    );
    const targetX = Math.min(
      boardBox!.x + boardBox!.width - magnetBox!.width / 2 - 6,
      startX + 34,
    );
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const session = await page.context().newCDPSession(page);

    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 1 }],
      });
      await expect(magnet).toHaveAttribute('data-picked-up', 'true');

      for (let step = 1; step <= 8; step += 1) {
        const progress = step / 8;
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{
            x: startX + (targetX - startX) * progress,
            y: startY + (targetY - startY) * progress,
            id: 1,
          }],
        });
        await page.waitForTimeout(18);
      }

      const during = await relativePosition(board, magnet);
      expect(positionDistance(before, during)).toBeGreaterThan(24);
      expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(1);

      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await expect(magnet).not.toHaveAttribute('data-picked-up', 'true');
      await expect(magnet).not.toHaveAttribute('data-dragging', 'true');

      const tapTarget = board.getByRole('link', { name: 'Hurt', exact: true });
      const tapBox = await tapTarget.boundingBox();
      expect(tapBox).not.toBeNull();
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{
          x: tapBox!.x + tapBox!.width / 2,
          y: tapBox!.y + tapBox!.height / 2,
          id: 2,
        }],
      });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await expect(page).toHaveURL(/\/feelings\/hurt$/);
    } finally {
      await session.detach();
    }

    expect(runtimeProblems).toEqual([]);
  });

  test('mobile keeps the editor first, avoids duplicate controls, and never overflows', async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto('/observations');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByLabel('Primary navigation magnets').getByRole('button', { name: 'Customizer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open customizer' })).toBeHidden();

    const editorBox = await page.getByLabel('What did you notice?').boundingBox();
    const guidanceBox = await page.locator('details').filter({ hasText: 'Why try this?' }).boundingBox();
    expect(editorBox).not.toBeNull();
    expect(guidanceBox).not.toBeNull();
    expect(editorBox!.y).toBeLessThan(guidanceBox!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(runtimeProblems).toEqual([]);
  });

  test('long mobile overlays keep their dismissal controls on screen', async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto('/');

    await page.getByLabel('Primary navigation magnets').getByRole('button', { name: 'Customizer' }).click();
    const customizer = page.getByRole('dialog', { name: 'Customizer' });
    const customizerBody = customizer.locator('[data-customizer-scroll-body]');
    const closeCustomizer = customizer.getByRole('button', { name: 'Close customizer' });
    await expect(customizer).toBeVisible();
    await expect(customizerBody).toHaveJSProperty('scrollTop', 0);
    await customizerBody.evaluate((body) => { body.scrollTop = body.scrollHeight; });
    expect(await customizerBody.evaluate((body) => body.scrollTop)).toBeGreaterThan(0);
    const customizerBox = await customizer.boundingBox();
    const customizerCloseBox = await closeCustomizer.boundingBox();
    expect(customizerBox).not.toBeNull();
    expect(customizerCloseBox).not.toBeNull();
    expect(customizerCloseBox!.y).toBeGreaterThanOrEqual(customizerBox!.y);
    expect(customizerCloseBox!.y + customizerCloseBox!.height).toBeLessThanOrEqual(customizerBox!.y + customizerBox!.height);

    await closeCustomizer.click();
    await page.goto('/observations');
    await page.getByRole('button', { name: 'Observation basics' }).click();
    const observationHelp = page.getByRole('dialog', { name: 'Observation help' });
    const helpBody = observationHelp.locator('[data-observation-dialog-body]');
    const closeHelp = observationHelp.getByRole('button', { name: 'Close observation help' });
    await helpBody.evaluate((body) => {
      body.append(...Array.from({ length: 18 }, (_, index) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = `Overflow regression content ${index + 1}`;
        return paragraph;
      }));
      body.scrollTop = body.scrollHeight;
    });
    expect(await helpBody.evaluate((body) => body.scrollTop)).toBeGreaterThan(0);
    const helpBox = await observationHelp.boundingBox();
    const helpCloseBox = await closeHelp.boundingBox();
    expect(helpBox).not.toBeNull();
    expect(helpCloseBox).not.toBeNull();
    expect(helpCloseBox!.y).toBeGreaterThanOrEqual(helpBox!.y);
    expect(helpCloseBox!.y + helpCloseBox!.height).toBeLessThanOrEqual(helpBox!.y + helpBox!.height);

    await closeHelp.click();
    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByRole('dialog', { name: 'allneeds.app menu' });
    const closeMenu = menu.getByRole('button', { name: 'Close menu' });
    const closeSize = await closeMenu.evaluate((button) => {
      const style = getComputedStyle(button);
      return { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height) };
    });
    expect(closeSize.width).toBeGreaterThanOrEqual(44);
    expect(closeSize.height).toBeGreaterThanOrEqual(44);
    expect(runtimeProblems).toEqual([]);
  });

  test('Customizer color samples drag with the legacy hue and lightness gesture', async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto('/');
    await page.getByLabel('Primary navigation magnets').getByRole('button', { name: 'Customizer' }).click();

    const customizer = page.getByRole('dialog', { name: 'Customizer' });
    const swatch = customizer.getByRole('button', { name: /Adjust Canvas glow color/ });
    const hexField = customizer.getByRole('textbox', { name: 'Canvas glow' });
    const startingHex = await hexField.inputValue();
    const box = await swatch.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2 - 30, { steps: 5 });
    await expect(hexField).not.toHaveValue(startingHex);
    await page.mouse.up();

    const committedHex = await hexField.inputValue();
    expect(committedHex).toMatch(/^#[0-9A-F]{6}$/);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--plum').trim().toUpperCase())).toBe(committedHex);
    expect(runtimeProblems).toEqual([]);
  });

  test('Feeling details expose the complete mobile inference and persistent evidence close control', async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto('/feelings/hurt');
    const disclosure = page.getByRole('button', { name: /How this feeling may show up/ });
    await expect(disclosure).toBeVisible();
    await disclosure.click();

    await expect(page.getByRole('heading', { name: 'Typical pattern' })).toBeVisible();
    await expect(page.getByText('Low energy · Unpleasant', { exact: true })).toBeVisible();
    await expect(page.locator('[data-option-id]')).toHaveCount(11);
    const whyThese = page.getByRole('button', { name: 'Why these?' });
    await whyThese.click();

    const dialog = page.getByRole('dialog', { name: 'Why these?' });
    const dialogBody = dialog.locator('[data-feeling-evidence-body]');
    const close = dialog.getByRole('button', { name: 'Close' });
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();
    await dialogBody.evaluate((body) => { body.scrollTop = body.scrollHeight; });
    expect(await dialogBody.evaluate((body) => body.scrollTop)).toBeGreaterThan(0);
    const dialogBox = await dialog.boundingBox();
    const closeBox = await close.boundingBox();
    expect(dialogBox).not.toBeNull();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.y).toBeGreaterThanOrEqual(dialogBox!.y);
    expect(closeBox!.y + closeBox!.height).toBeLessThanOrEqual(dialogBox!.y + dialogBox!.height);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(whyThese).toBeFocused();

    await page.goto('/feelings/energized');
    await expect(page.getByRole('button', { name: /How this feeling may show up/ })).toHaveCount(0);
    expect(runtimeProblems).toEqual([]);
  });
});

test('Menu Journal opens the full-screen entry and History stays compact', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'allneeds.app menu' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Journal' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'History', exact: true })).toBeVisible();
  await expect(menu.getByText('Journal history', { exact: true })).toHaveCount(0);

  await menu.getByRole('button', { name: 'Journal' }).click();
  await expect(page).toHaveURL(/\/inventory\/journal\?compose=new$/);
  const journal = page.getByRole('dialog', { name: 'Journal' });
  await expect(journal).toBeVisible();
  await expect(journal.getByLabel('Reflection')).toBeFocused();
  expect(runtimeProblems).toEqual([]);
});
