import { expect, test } from './fixtures';

test('Check-In is an opt-in navigation magnet with persistent direct routing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const board = page.getByLabel('Primary navigation magnets');
  await expect(board.getByRole('link', { name: 'Feeling check-in' })).toHaveCount(0);

  await board.getByRole('button', { name: 'Customizer' }).click();
  let panel = page.getByRole('dialog', { name: 'Customizer' });
  await panel.getByText('Check-In', { exact: true }).click();
  await expect(panel.getByRole('switch', { name: 'Check-In' })).toBeChecked();
  await panel.getByRole('button', { name: 'Close customizer' }).click();

  await expect(board.getByRole('link', { name: 'Feeling check-in' })).toHaveAttribute('href', '/alexithymia-support');
  await board.getByRole('link', { name: 'Feeling check-in' }).click();
  await expect(page).toHaveURL(/\/alexithymia-support$/);
  await page.reload();
  await expect(board.getByRole('link', { name: 'Feeling check-in' })).toBeVisible();
  // Persist the visible position before hiding the magnet.
  await board.getByRole('switch').press('Space');
  await expect(board.getByRole('switch')).not.toBeChecked();
  const storedPosition = await page.evaluate(() => {
    const raw = localStorage.getItem('magnetPositions:site-nav');
    const state = raw ? JSON.parse(raw) : null;
    return state?.layouts?.compact?.magnets?.['nav-check-in'] ?? null;
  });
  expect(storedPosition).not.toBeNull();

  await board.getByRole('button', { name: 'Customizer' }).click();
  panel = page.getByRole('dialog', { name: 'Customizer' });
  await panel.getByText('Check-In', { exact: true }).click();
  await expect(panel.getByRole('switch', { name: 'Check-In' })).not.toBeChecked();
  await panel.getByRole('button', { name: 'Close customizer' }).click();
  await expect(board.getByRole('link', { name: 'Feeling check-in' })).toHaveCount(0);
  // A persistence write while hidden must not erase the last known position.
  await board.getByRole('switch').press('Space');
  await expect(board.getByRole('switch')).toBeChecked();
  await board.getByRole('switch').press('Space');
  await expect(board.getByRole('switch')).not.toBeChecked();
  const afterHidden = await page.evaluate(() => {
    const raw = localStorage.getItem('magnetPositions:site-nav');
    const state = raw ? JSON.parse(raw) : null;
    return state?.layouts?.compact?.magnets?.['nav-check-in'] ?? null;
  });
  expect(afterHidden).toEqual(storedPosition);
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

test('sending a check-in to Journal never overwrites an unfinished writing page', async ({ page }) => {
  await page.goto('/inventory/journal?compose=new');
  const journal = page.getByRole('dialog', { name: 'Journal' });
  await journal.getByLabel('Reflection').fill('Keep this unfinished reflection');
  await journal.getByRole('button', { name: 'Close full screen journal' }).click();

  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in' }).click();
  await page.getByRole('textbox', { name: 'What happened?', exact: true }).fill('Something difficult happened.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Browse all feelings' }).click();
  await page.getByRole('button', { name: 'No word yet' }).click();
  await page.getByRole('button', { name: 'Use these words' }).click();
  await page.getByRole('button', { name: 'Build sentence' }).click();
  await page.getByRole('button', { name: 'Add to Journal' }).click();
  await expect(page).toHaveURL(/\/alexithymia-support$/);
  await expect(page.getByText(/Journal has an unfinished page/)).toBeVisible();

  await page.goto('/inventory/journal?compose=new');
  await expect(page.getByRole('dialog', { name: 'Journal' }).getByLabel('Reflection'))
    .toHaveValue('Keep this unfinished reflection');
});
