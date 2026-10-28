import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

test.use({ hasTouch: true });

async function clues(page: Page) {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
}

async function needs(page: Page) {
  await clues(page);
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
  return page.getByRole('dialog', { name: 'What matters to you here?', exact: true });
}

async function swipe(page: Page, target: Locator, dx: number, dy: number, cancel = false) {
  const bounds = await target.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width / 2;
  const y = bounds!.y + Math.min(18, bounds!.height / 2);
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i += 1) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 8, y: y + dy * i / 8 }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
  { width: 320, height: 568, largeText: true },
]) {
  test(`expanded rating help keeps the full heading and normal paragraph flow at ${viewport.width}px${viewport.largeText ? ', doubled text' : ''}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await clues(page);
    if (viewport.largeText) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.getByRole('button', { name: /^Overall feeling/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Overall feeling', exact: true });
    for (const label of ['Ability to influence what happens', 'Familiar or surprising']) {
      const scale = sheet.getByRole('group', { name: label, exact: true });
      const title = scale.locator('legend > span');
      const closedWidth = await title.evaluate(element => element.getBoundingClientRect().width);
      const help = scale.getByLabel(`About ${label}`, { exact: true });
      await help.click();
      await expect(scale.locator('details')).toHaveAttribute('open', '');
      const paragraph = scale.locator('details p');
      await expect(paragraph).toBeVisible();
      await expect(paragraph).toHaveCSS('font-weight', '400');
      const geometry = await scale.evaluate(element => {
        const titleBox = element.querySelector('legend > span')!.getBoundingClientRect();
        const text = element.querySelector('details p')!.getBoundingClientRect();
        const legend = element.querySelector('legend')!.getBoundingClientRect();
        return { titleWidth: titleBox.width, titleBottom: titleBox.bottom, textTop: text.top, textWidth: text.width, legendWidth: legend.width, left: legend.left, right: legend.right };
      });
      expect(Math.abs(geometry.titleWidth - closedWidth)).toBeLessThanOrEqual(1);
      expect(geometry.textTop).toBeGreaterThanOrEqual(geometry.titleBottom);
      expect(geometry.textWidth).toBeGreaterThanOrEqual(geometry.legendWidth - 1);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(viewport.width + 1);
      await expect(sheet.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
      await page.screenshot({ path: `test-results/rating-help-${viewport.width}${viewport.largeText ? '-large' : ''}-${label.startsWith('Ability') ? 'influence' : 'familiar'}.png` });
      await help.click();
    }
    await sheet.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(sheet).toBeHidden();
  });

  test(`Need search and completion remain reachable without a nested board frame at ${viewport.width}px${viewport.largeText ? ', doubled text' : ''}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const sheet = await needs(page);
    if (viewport.largeText) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const search = sheet.getByRole('searchbox', { name: 'Search all needs', exact: true });
    const done = sheet.getByRole('button', { name: 'Done', exact: true });
    const initialSheet = await sheet.boundingBox();
    await expect(search).not.toBeFocused();
    await expect(sheet.locator('details')).not.toHaveAttribute('open');
    await expect(sheet.getByLabel('Need choices', { exact: true })).toHaveCSS('border-top-width', '0px');
    const body = sheet.locator('[data-overlay-body]');
    await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(search).toBeInViewport();
    await expect(done).toBeInViewport();
    await expect(sheet.getByText('0 Needs selected', { exact: true })).toBeInViewport();
    await search.fill('Safety');
    const filteredSheet = await sheet.boundingBox();
    expect(Math.abs(filteredSheet!.height - initialSheet!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(filteredSheet!.y - initialSheet!.y)).toBeLessThanOrEqual(1);
    const choice = sheet.getByRole('button', { name: /^Safety(?:, selected)?$/ });
    await choice.click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    await expect(choice.locator('[aria-hidden="true"]').filter({ hasText: '✓' })).toBeVisible();
    await expect(sheet.getByText('1 Need selected', { exact: true })).toBeInViewport();
    await expect(done).toBeInViewport();
    await expect(sheet.getByRole('button', { name: 'Clear selected Needs', exact: true })).toBeInViewport();
    const visibleChoice = await choice.boundingBox();
    const searchBounds = await search.boundingBox();
    const bodyBounds = await body.boundingBox();
    expect(visibleChoice!.y).toBeGreaterThanOrEqual(searchBounds!.y + searchBounds!.height);
    expect(visibleChoice!.y + visibleChoice!.height).toBeLessThanOrEqual(bodyBounds!.y + bodyBounds!.height + 1);
    await page.screenshot({ path: `test-results/need-picker-${viewport.width}${viewport.largeText ? '-large' : ''}.png` });
    await done.click();
    await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
    await expect(sheet.getByRole('button', { name: 'Safety, selected', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });
}

test('touch header drags dismiss sheets without clearing answers; short, upward, sideways and cancelled drags do not', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await clues(page);
  const trigger = page.getByRole('button', { name: /^Overall feeling/ });
  await trigger.click();
  const sheet = page.getByRole('dialog', { name: 'Overall feeling', exact: true });
  const chrome = sheet.locator('[data-sheet-chrome]');
  const power = sheet.getByRole('group', { name: 'Ability to influence what happens', exact: true });
  await power.locator('input[value="0.5"]').locator('..').click();
  await expect(power.getByText('Selected: 3 of 5', { exact: true })).toBeVisible();
  for (const [dx, dy, cancel] of [[0, 10, false], [0, -60, false], [130, 12, false], [0, 90, true]] as const) {
    await swipe(page, chrome, dx, dy, cancel);
    await expect(sheet).toBeVisible();
    await expect(sheet).not.toHaveAttribute('data-sheet-dragging');
    await expect.poll(() => sheet.evaluate(element => getComputedStyle(element).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  }
  await swipe(page, chrome, 8, 100);
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(power.getByText('Selected: 3 of 5', { exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: 'Close Overall feeling', exact: true }).click();
  await page.getByRole('button', { name: /^Body clues/ }).click();
  const body = page.getByRole('dialog', { name: 'Body clues', exact: true });
  await body.getByRole('button', { name: /^Tight or constricted/ }).click();
  await swipe(page, body.locator('[data-sheet-chrome]'), 0, 100);
  await expect(body).toBeHidden();
  await expect(page.getByRole('button', { name: 'Body clues 1 cue selected.', exact: true })).toBeVisible();
});

test('touch scrolling the Need board does not dismiss; dragging its header preserves selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const sheet = await needs(page);
  const body = sheet.locator('[data-overlay-body]');
  // An empty gap near the left edge belongs to scrolling, not sheet dismissal.
  const box = await body.boundingBox();
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box!.x + 3, y: box!.y + box!.height * .8 }] });
  for (let i = 1; i <= 10; i += 1) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box!.x + 3, y: box!.y + box!.height * .8 - i * 20 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
  await expect(sheet).toBeVisible();
  await expect.poll(() => body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await sheet.getByRole('searchbox').fill('Safety');
  await sheet.getByRole('button', { name: 'Safety', exact: true }).click();
  await swipe(page, sheet.locator('[data-sheet-chrome]'), 0, 100);
  await expect(sheet).toBeHidden();
  await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Safety, selected', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('desktop sheet header does not advertise or take over a swipe gesture', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await clues(page);
  await page.getByRole('button', { name: /^Overall feeling/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Overall feeling', exact: true });
  await expect(sheet.locator('[class*="handle"]')).toBeHidden();
  await swipe(page, sheet.locator('[data-sheet-chrome]'), 0, 100);
  await expect(sheet).toBeVisible();
  await expect(sheet).not.toHaveAttribute('data-sheet-dragging');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
});
