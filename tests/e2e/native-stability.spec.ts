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
