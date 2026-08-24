import type { Locator } from '@playwright/test';

import { expect, test } from './fixtures';

type PositionedMagnet = {
  id: string;
  centerX: number;
  centerY: number;
  height: number;
};

async function visualOrder(board: Locator) {
  const magnets = board.locator('[data-magnet-id]');
  const positioned: PositionedMagnet[] = [];

  for (let index = 0; index < await magnets.count(); index += 1) {
    const magnet = magnets.nth(index);
    const box = await magnet.boundingBox();
    expect(box, `magnet ${index} should have a rendered box`).not.toBeNull();
    positioned.push({
      id: (await magnet.getAttribute('data-magnet-id'))!,
      centerX: box!.x + box!.width / 2,
      centerY: box!.y + box!.height / 2,
      height: box!.height,
    });
  }

  const typicalHeight = [...positioned]
    .map((magnet) => magnet.height)
    .sort((a, b) => a - b)[Math.floor(positioned.length / 2)] ?? 44;
  const rows: Array<{ centerY: number; magnets: PositionedMagnet[] }> = [];

  [...positioned]
    .sort((a, b) => a.centerY - b.centerY)
    .forEach((magnet) => {
      const row = rows.find((candidate) =>
        Math.abs(candidate.centerY - magnet.centerY) <= typicalHeight * 0.72,
      );
      if (!row) {
        rows.push({ centerY: magnet.centerY, magnets: [magnet] });
        return;
      }
      row.magnets.push(magnet);
      row.centerY = row.magnets.reduce((sum, item) => sum + item.centerY, 0) / row.magnets.length;
    });

  return rows
    .sort((a, b) => a.centerY - b.centerY)
    .flatMap((row) => row.magnets.sort((a, b) => a.centerX - b.centerX))
    .map((magnet) => magnet.id);
}

test('nav Play order becomes the compact grid order and survives reload', async ({ page }) => {
  const runtimeProblems: string[] = [];
  page.on('pageerror', (error) => runtimeProblems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      runtimeProblems.push(`${message.type()}: ${message.text()}`);
    }
  });

  await page.goto('/');
  const board = page.getByLabel('Primary navigation magnets');
  await expect(board).toHaveAttribute('data-ready', 'true');
  const playToggle = board.getByRole('switch');
  await expect(playToggle).toBeChecked();
  await expect(board).toHaveAttribute('data-active', 'true');

  const initialOrder = await visualOrder(board);
  const firstMagnet = board.locator('[data-magnet-id]').filter({
    has: page.getByText('+', { exact: true }),
  });
  const lastMagnet = board.locator(`[data-magnet-id="${initialOrder.at(-1)}"]`);

  const firstBox = await firstMagnet.boundingBox();
  const lastBox = await lastMagnet.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(lastBox).not.toBeNull();
  await page.mouse.move(firstBox!.x + firstBox!.width / 2, firstBox!.y + firstBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    lastBox!.x + lastBox!.width + firstBox!.width / 2 + 4,
    lastBox!.y + lastBox!.height / 2,
    { steps: 18 },
  );
  await page.mouse.up();

  await expect(firstMagnet).not.toHaveAttribute('data-dragging', 'true');
  await page.waitForTimeout(1_400);
  const arrangedOrder = await visualOrder(board);
  expect(arrangedOrder).not.toEqual(initialOrder);

  await playToggle.press('Space');
  await expect(board).toHaveAttribute('data-active', 'false');
  await expect.poll(() => visualOrder(board)).toEqual(arrangedOrder);
  const compactBox = await board.boundingBox();
  expect(compactBox?.height).toBeLessThanOrEqual(82);

  await page.reload();
  await expect(board).toHaveAttribute('data-ready', 'true');
  await expect(playToggle).not.toBeChecked();
  await expect.poll(() => visualOrder(board)).toEqual(arrangedOrder);
  expect(runtimeProblems).toEqual([]);
});
