import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

type Position = { x: number; y: number };

async function magnetPosition(board: Locator, magnet: Locator): Promise<Position> {
  await expect(board).toHaveAttribute('data-ready', 'true');
  return magnet.evaluate((element) => ({
    x: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-x')),
    y: Number.parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-y')),
  }));
}

function distance(first: Position, second: Position) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

async function ensurePhysicsOn(board: Locator) {
  const toggle = board.getByRole('switch');
  if (await toggle.getAttribute('aria-label') === 'Enable magnet physics') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-label', 'Disable magnet physics');
}

async function showOnlyAcceptance(page: Page) {
  await page.goto('/needs');
  await page.getByRole('searchbox', { name: 'Search needs' }).fill('Acceptance');
  const board = page.getByLabel('Needs magnet board');
  await expect(board).toHaveAttribute('data-ready', 'true');
  await ensurePhysicsOn(board);
  const magnet = board.getByRole('link', { name: 'Acceptance', exact: true });
  await expect(magnet).toBeVisible();
  return { board, magnet };
}

test.describe('mobile need magnet sizing', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps the longest need label inside the board', async ({ page }) => {
    await page.goto('/needs');
    const board = page.getByLabel('Needs magnet board');
    await expect(board).toHaveAttribute('data-ready', 'true');
    const magnet = board.getByRole('link', {
      name: 'Do things at my own pace and in my own way',
      exact: true,
    });
    await expect(magnet).toBeVisible();

    const boardBox = await board.boundingBox();
    const magnetBox = await magnet.boundingBox();
    expect(boardBox).not.toBeNull();
    expect(magnetBox).not.toBeNull();
    expect(magnetBox!.width).toBeLessThanOrEqual(boardBox!.width - 20);
    await expect(magnet.locator('span').last()).not.toHaveCSS('white-space', 'nowrap');
  });
});

test('dragging stays in board-local coordinates when the visual board origin shifts', async ({ page }) => {
  const { board, magnet } = await showOnlyAcceptance(page);
  const before = await magnetPosition(board, magnet);
  const magnetBox = await magnet.boundingBox();
  expect(magnetBox).not.toBeNull();

  const startX = magnetBox!.x + magnetBox!.width / 2;
  const startY = magnetBox!.y + magnetBox!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();

  await board.evaluate((element) => {
    (element as HTMLElement).style.transform = 'translateY(-120px)';
  });
  await page.mouse.move(startX + 12, startY);
  await page.waitForTimeout(60);

  const during = await magnetPosition(board, magnet);
  expect(Math.abs(during.y - before.y)).toBeLessThanOrEqual(3);
  expect(during.x - before.x).toBeGreaterThan(7);
  await page.mouse.up();
});

test('holding and dragging empty desktop board space pushes magnets as a collider', async ({ page }) => {
  const { board, magnet } = await showOnlyAcceptance(page);
  const before = await magnetPosition(board, magnet);
  const boardBox = await board.boundingBox();
  const magnetBox = await magnet.boundingBox();
  expect(boardBox).not.toBeNull();
  expect(magnetBox).not.toBeNull();

  const centerY = magnetBox!.y + magnetBox!.height / 2;
  const startX = Math.min(
    boardBox!.x + boardBox!.width - 30,
    magnetBox!.x + magnetBox!.width + 180,
  );
  const targetX = magnetBox!.x + magnetBox!.width * 0.72;

  await page.mouse.move(startX, centerY);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) {
    const progress = step / 12;
    await page.mouse.move(startX + (targetX - startX) * progress, centerY);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.waitForTimeout(240);

  const after = await magnetPosition(board, magnet);
  expect(distance(after, before)).toBeGreaterThan(8);
});

test.describe('mobile deep-scroll magnet dragging', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps a held need magnet aligned after scrolling deep into the board', async ({ page }) => {
    await page.goto('/needs');
    const board = page.getByLabel('Needs magnet board');
    await expect(board).toHaveAttribute('data-ready', 'true');
    await ensurePhysicsOn(board);
    const magnet = board.getByRole('link', { name: 'Acceptance', exact: true });
    await magnet.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);

    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(300);
    const before = await magnetPosition(board, magnet);
    const box = await magnet.boundingBox();
    expect(box).not.toBeNull();

    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 1 }],
      });
      await expect(magnet).toHaveAttribute('data-picked-up', 'true');

      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 14, y: startY + 18, id: 1 }],
      });
      await page.waitForTimeout(80);

      const during = await magnetPosition(board, magnet);
      const movedX = during.x - before.x;
      const movedY = during.y - before.y;
      expect(movedX).toBeGreaterThan(8);
      expect(movedX).toBeLessThan(22);
      expect(movedY).toBeGreaterThan(11);
      expect(movedY).toBeLessThan(28);
      expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(1);
    } finally {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      }).catch(() => undefined);
      await session.detach();
    }
  });
});

test.describe('mobile deep-scroll pickup geometry', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('picking up Predictability does not scale its board translation', async ({ page }) => {
    await page.goto('/needs');
    const board = page.getByLabel('Needs magnet board');
    await expect(board).toHaveAttribute('data-ready', 'true');
    await ensurePhysicsOn(board);
    const magnet = board.getByRole('link', { name: 'Predictability', exact: true });
    await magnet.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(300);
    const positionBefore = await magnetPosition(board, magnet);
    const boxBefore = await magnet.boundingBox();
    expect(boxBefore).not.toBeNull();

    const startX = boxBefore!.x + boxBefore!.width / 2;
    const startY = boxBefore!.y + boxBefore!.height / 2;
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 1 }],
      });
      await expect(magnet).toHaveAttribute('data-picked-up', 'true');
      await page.waitForTimeout(220);

      const positionAfter = await magnetPosition(board, magnet);
      const boxAfter = await magnet.boundingBox();
      expect(boxAfter).not.toBeNull();
      expect(distance(positionAfter, positionBefore)).toBeLessThanOrEqual(1);

      const centerBefore = {
        x: boxBefore!.x + boxBefore!.width / 2,
        y: boxBefore!.y + boxBefore!.height / 2,
      };
      const centerAfter = {
        x: boxAfter!.x + boxAfter!.width / 2,
        y: boxAfter!.y + boxAfter!.height / 2,
      };
      expect(Math.abs(centerAfter.x - centerBefore.x)).toBeLessThanOrEqual(3);
      expect(centerAfter.y - centerBefore.y).toBeGreaterThanOrEqual(-18);
      expect(centerAfter.y - centerBefore.y).toBeLessThanOrEqual(2);
      expect(boxAfter!.width).toBeGreaterThan(boxBefore!.width * 1.04);
      expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(1);
    } finally {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      }).catch(() => undefined);
      await session.detach();
    }
  });
});
