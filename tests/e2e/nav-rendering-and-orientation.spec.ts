import { expect, test } from './fixtures';

test('desktop navigation magnets stay crisp and steady until an actual drag begins', async ({ page }) => {
  await page.goto('/needs');

  const board = page.getByLabel('Primary navigation magnets');
  await expect(board).toHaveAttribute('data-ready', 'true');
  const needMagnet = board.locator('[data-magnet-id="nav-needs"]');
  await expect(needMagnet).toBeVisible();
  await expect(needMagnet).toHaveCSS('transform', 'none');
  await expect(needMagnet).toHaveCSS('filter', 'none');

  const before = await needMagnet.boundingBox();
  expect(before).not.toBeNull();
  const centerX = before!.x + before!.width / 2;
  const centerY = before!.y + before!.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await expect(needMagnet).toHaveAttribute('data-picked-up', 'true');

  const held = await needMagnet.boundingBox();
  expect(held).not.toBeNull();
  expect(Math.hypot(held!.x - before!.x, held!.y - before!.y)).toBeLessThan(1.5);
  await expect(needMagnet).toHaveCSS('transform', 'none');
  expect(await needMagnet.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none');

  await page.mouse.up();
  await expect(needMagnet).not.toHaveAttribute('data-picked-up', 'true');
});

test('mobile customizer can lock and unlock the current screen orientation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'maxTouchPoints', {
      configurable: true,
      get: () => 1,
    });

    const orientation = screen.orientation ?? ({ type: 'portrait-primary' } as ScreenOrientation);
    if (!screen.orientation) {
      Object.defineProperty(screen, 'orientation', { configurable: true, value: orientation });
    }
    Object.defineProperty(orientation, 'lock', {
      configurable: true,
      value: async (target: string) => {
        (window as unknown as { __orientationLockTarget?: string }).__orientationLockTarget = target;
      },
    });
    Object.defineProperty(orientation, 'unlock', {
      configurable: true,
      value: () => {
        (window as unknown as { __orientationUnlockCount?: number }).__orientationUnlockCount =
          ((window as unknown as { __orientationUnlockCount?: number }).__orientationUnlockCount ?? 0) + 1;
      },
    });
  });

  await page.goto('/needs');
  await page.getByLabel('Primary navigation magnets').getByRole('button', { name: 'Customizer' }).click();
  const customizer = page.getByRole('dialog', { name: 'Customizer' });
  const orientationSwitch = customizer.getByRole('switch', { name: 'Lock screen orientation' });

  await expect(orientationSwitch).toBeVisible();
  await expect(orientationSwitch).toHaveText('Off');
  await expect(orientationSwitch).toHaveAttribute('aria-checked', 'false');

  await orientationSwitch.click();
  await expect(orientationSwitch).toHaveText('On');
  await expect(orientationSwitch).toHaveAttribute('aria-checked', 'true');
  await expect(customizer.getByText(/Locked to .* orientation while this page is open\./)).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __orientationLockTarget?: string }).__orientationLockTarget)).toMatch(/portrait|landscape/);

  await orientationSwitch.click();
  await expect(orientationSwitch).toHaveText('Off');
  await expect(orientationSwitch).toHaveAttribute('aria-checked', 'false');
  expect(await page.evaluate(() => (window as unknown as { __orientationUnlockCount?: number }).__orientationUnlockCount)).toBe(1);
});
