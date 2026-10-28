import { expect, test, openCheckInReview } from './fixtures';

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

  const checkIn = board.getByRole('link', { name: 'Feeling check-in' });
  await expect(checkIn).toHaveAttribute('href', '/alexithymia-support');
  const doorwayPulse = page.locator('a[class*="doorLink"][href="/feelings"] span[class*="icon"]');
  const magnetPulse = checkIn.locator('span[class*="checkInPulse"]');
  await expect(doorwayPulse).toBeVisible();
  await expect(magnetPulse).toBeVisible();
  // Both masks must resolve to the same canonical SVG.
  const doorwayMask = await doorwayPulse.evaluate((element) => getComputedStyle(element).maskImage);
  const magnetMask = await magnetPulse.evaluate((element) => getComputedStyle(element).maskImage);
  expect(doorwayMask).toContain('feature-feelings.svg');
  expect(magnetMask).toBe(doorwayMask);
  // Oversizing the mask (formerly 116%) clips the SVG's end circle.
  // Both presentations must fit the full artwork into their icon slots.
  const doorwaySize = await doorwayPulse.evaluate((element) => getComputedStyle(element).maskSize);
  const magnetSize = await magnetPulse.evaluate((element) => getComputedStyle(element).maskSize);
  expect(doorwaySize).toBe('contain');
  expect(magnetSize).toBe(doorwaySize);
  // Both surfaces share one continuous, unobstructed signal trace. The former
  // detached end-circle must not return at small navigation-icon sizes.
  const iconResponse = await page.request.get('/icons/feature-feelings.svg');
  expect(iconResponse.ok()).toBe(true);
  const iconSource = await iconResponse.text();
  expect((iconSource.match(/<path\b/g) ?? [])).toHaveLength(1);
  expect(iconSource).not.toMatch(/<(?:circle|ellipse|rect|polygon|polyline)\b/);
  expect(iconSource).toContain('stroke-linecap="round"');
  // The thin-line Feelings mark must match the eye and sprout at the source,
  // while both Feelings consumers continue to share that single asset.
  for (const iconName of ['feature-feelings', 'feature-observation-eye', 'feature-needs']) {
    const icon = await page.request.get(`/icons/${iconName}.svg`);
    expect(icon.ok()).toBe(true);
    expect(await icon.text()).toContain('stroke-width="2.5"');
  }
  await expect(checkIn.locator('svg')).toHaveCount(0);
  const iconWidth = await magnetPulse.evaluate((element) => element.getBoundingClientRect().width);
  expect(iconWidth).toBeGreaterThanOrEqual(16);
  expect(iconWidth).toBeLessThanOrEqual(24);

  await checkIn.click();
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
  await expect(sheet.getByText('Point selected', { exact: true })).toBeVisible();
  const alternatives = sheet.getByRole('group', { name: 'Instead of a point', exact: true });
  await expect(alternatives).toBeVisible();
  await expect(alternatives.getByRole('button', { name: 'Mixed feelings' })).toHaveAttribute('aria-pressed', 'false');
  await expect(alternatives.getByRole('button', { name: 'Not sure' })).toHaveAttribute('aria-pressed', 'false');
  await expect(alternatives.getByRole('button', { name: 'Clear' })).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: /^Overall feeling/ }).click();
  await expect(sheet.locator('output')).toHaveText('Valence +3 · Arousal +3');

  await sheet.getByRole('button', { name: 'Mixed feelings' }).click();
  await expect(sheet.locator('output')).toHaveText('Mixed feelings selected');
  await expect(sheet.getByText('Point selected', { exact: true })).toHaveCount(0);
  await alternatives.getByRole('button', { name: 'Not sure', exact: true }).click();
  await expect(sheet.locator('output')).toHaveText('Not sure selected');
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
  await page.getByRole('button', { name: 'Continue to words' }).click();
  await page.getByRole('button', { name: 'Continue without a word' }).click();
  await openCheckInReview(page);
  await page.getByRole('button', { name: 'Build sentence' }).click();
  await page.getByRole('button', { name: 'Continue in Journal' }).click();
  await expect(page).toHaveURL(/\/alexithymia-support$/);
  await expect(page.getByText(/Journal has an unfinished page/)).toBeVisible();

  await page.goto('/inventory/journal?compose=new');
  await expect(page.getByRole('dialog', { name: 'Journal' }).getByLabel('Reflection'))
    .toHaveValue('Keep this unfinished reflection');
});
