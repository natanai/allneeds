import { expect, test } from './fixtures';

test('Check-In is an opt-in navigation magnet with persistent direct routing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const board = page.getByLabel('Primary navigation magnets');
  await expect(board.getByRole('link', { name: 'Feeling check-in' })).toHaveCount(0);

  await board.getByRole('button', { name: 'Customizer' }).click();
  let panel = page.getByRole('dialog', { name: 'Customizer' });
  await panel.getByRole('switch', { name: 'Check-In' }).check();
  await panel.getByRole('button', { name: 'Close customizer' }).click();

  await expect(board.getByRole('link', { name: 'Feeling check-in' })).toHaveAttribute('href', '/alexithymia-support');
  await board.getByRole('link', { name: 'Feeling check-in' }).click();
  await expect(page).toHaveURL(/\/alexithymia-support$/);
  await page.reload();
  await expect(board.getByRole('link', { name: 'Feeling check-in' })).toBeVisible();

  await board.getByRole('button', { name: 'Customizer' }).click();
  panel = page.getByRole('dialog', { name: 'Customizer' });
  await panel.getByRole('switch', { name: 'Check-In' }).uncheck();
  await panel.getByRole('button', { name: 'Close customizer' }).click();
  await expect(board.getByRole('link', { name: 'Feeling check-in' })).toHaveCount(0);
});

test('both emotional maps repaint their whole surface while selecting and dragging', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: /^Overall feeling/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Overall feeling' });
  const plane = sheet.getByTestId('valence-arousal-field');
  await expect(plane).toBeVisible();
  await expect(sheet.locator('input[name="alex-shape-pleasantness"]')).toHaveCount(0);
  const box = await plane.boundingBox();
  if (!box) throw new Error('Emotional map is not visible');

  const baseline = await plane.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .8);
  await page.mouse.down();
  const first = await plane.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .2, { steps: 6 });
  const second = await plane.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.mouse.up();
  expect(first).not.toBe(baseline);
  expect(second).not.toBe(first);
  await expect(sheet.locator('output')).toHaveText('Valence +3 · Arousal +3');

  await sheet.getByRole('button', { name: 'Mixed feelings' }).click();
  await expect(sheet.locator('output')).toHaveText('Mixed feelings selected');
  await sheet.getByRole('button', { name: 'Clear' }).click();
  await expect(sheet.locator('output')).toHaveText('No point placed yet');
});
