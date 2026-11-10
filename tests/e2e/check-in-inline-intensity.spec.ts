import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const draftKey = 'allneeds.v2.alexithymia.draft';
async function openWords(page: Page) {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search feelings and other emotion words', exact: true }).fill('Anxiety');
}
async function savedChoice(page: Page) {
  return page.evaluate(key => {
    const draft = JSON.parse(localStorage.getItem(key) ?? 'null')?.data;
    return { decision: draft?.decisions?.['candidate:anxiety'] ?? null, rating: draft?.feelingIntensities?.['candidate:anxiety'] ?? null };
  }, draftKey);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 900 }, { width: 320, height: 568, largeText: true }]) {
  test(`inline feeling intensity selects, clears, and survives reload at ${viewport.width}px${viewport.largeText ? ' enlarged' : ''}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openWords(page);
    if (viewport.largeText) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const magnet = page.getByRole('group', { name: 'Anxiety controls', exact: true });
    const slider = magnet.getByRole('slider', { name: 'Anxiety intensity', exact: true });
    await expect(slider).toHaveValue('0');
    await expect(magnet.getByText('Not selected', { exact: true })).toBeVisible();
    expect(await magnet.evaluate(el => getComputedStyle(el, '::after').backgroundImage)).toContain('icons/feelings/anxiety.svg');
    await slider.fill('7');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(magnet.getByText('Fits', { exact: true })).toBeVisible();
    await expect(magnet.locator('output').first()).toHaveText('7/10');
    await expect(magnet.locator('[data-selected="true"]')).toBeVisible();
    await expect.poll(() => savedChoice(page)).toEqual({ decision: 'fits', rating: 7 });
    await slider.press('ArrowRight');
    await expect(slider).toHaveValue('8');
    await expect.poll(() => savedChoice(page)).toEqual({ decision: 'fits', rating: 8 });
    await slider.scrollIntoViewIfNeeded();
    const geometry = await slider.boundingBox();
    expect(geometry!.x).toBeGreaterThanOrEqual(0);
    expect(geometry!.x + geometry!.width).toBeLessThanOrEqual(viewport.width);
    expect(geometry!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await magnet.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/inline-feeling-${viewport.width}${viewport.largeText ? '-large' : ''}.png` });
    await page.reload();
    await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
    await expect(slider).toHaveValue('8');
    await slider.press('Home');
    await expect.poll(() => savedChoice(page)).toEqual({ decision: null, rating: null });
    await expect(magnet).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue without a word', exact: true })).toBeVisible();
  });
}

test('dismissal hides a word in every view, with visible Undo and an explicit unrated restore', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWords(page);
  const magnet = page.getByRole('group', { name: 'Anxiety controls', exact: true });
  await magnet.getByRole('slider').fill('6');
  await magnet.getByRole('button', { name: 'Not this time: Anxiety', exact: true }).click();
  await expect(magnet).toHaveCount(0);
  await expect.poll(() => savedChoice(page)).toEqual({ decision: 'not-this-time', rating: null });
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  await expect(undo).toBeInViewport();
  await undo.click();
  await expect(magnet.getByRole('slider')).toHaveValue('6');
  await magnet.getByRole('button', { name: 'Not this time: Anxiety', exact: true }).click();
  await page.getByRole('radio', { name: 'All words', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search feelings and other emotion words', exact: true }).fill('Anxiety');
  await expect(magnet).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  await expect(magnet).toHaveCount(0);
  await page.getByRole('button', { name: 'Show dismissed words (1)', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Dismissed words', exact: true });
  await sheet.getByRole('button', { name: 'Restore Anxiety', exact: true }).click();
  await sheet.getByRole('button', { name: 'Close Dismissed words', exact: true }).click();
  await expect(magnet.getByRole('slider')).toHaveValue('0');
  await expect.poll(() => savedChoice(page)).toEqual({ decision: null, rating: null });
});

test('slider gestures keep the magnet steady; dragging the label preserves the reported rating', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWords(page);
  const magnet = page.getByRole('group', { name: 'Anxiety controls', exact: true });
  const slider = magnet.getByRole('slider');
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  const before = (await magnet.boundingBox())!;
  await page.mouse.move(box.x + 12, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .75, box.y + box.height / 2, { steps: 14 });
  const during = (await magnet.boundingBox())!;
  expect(Math.abs(during.x - before.x)).toBeLessThan(1);
  expect(Math.abs(during.y - before.y)).toBeLessThan(1);
  await expect(magnet).not.toHaveAttribute('data-picked-up');
  await expect(slider.locator('..').locator('..')).toHaveAttribute('data-dragging', 'true');
  await page.mouse.up();
  const rating = await slider.inputValue();
  expect(Number(rating)).toBeGreaterThan(0);
  const handle = magnet.locator('[data-magnet-handle]');
  const handleBox = (await handle.boundingBox())!;
  const origin = await magnet.evaluate(el => ({ x: parseFloat((el as HTMLElement).style.getPropertyValue('--magnet-x')), y: parseFloat((el as HTMLElement).style.getPropertyValue('--magnet-y')) }));
  await page.mouse.move(handleBox.x + 12, handleBox.y + 12);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + 40, handleBox.y + 37, { steps: 6 });
  const moved = await magnet.evaluate(el => ({ x: parseFloat((el as HTMLElement).style.getPropertyValue('--magnet-x')), y: parseFloat((el as HTMLElement).style.getPropertyValue('--magnet-y')) }));
  expect(moved.x - origin.x).toBeGreaterThan(20);
  expect(moved.y - origin.y).toBeGreaterThan(15);
  await page.mouse.up();
  await expect(slider).toHaveValue(rating);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('manual Maybe stays tentative, while direct rating transfers to Journal without another confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWords(page);
  const magnet = page.getByRole('group', { name: 'Anxiety controls', exact: true });
  await magnet.getByRole('slider').fill('9');
  await magnet.getByRole('button', { name: 'Options for Anxiety', exact: true }).click();
  const options = page.getByRole('dialog', { name: 'Anxiety', exact: true });
  await expect(options.getByRole('button', { name: 'Use this rating' })).toHaveCount(0);
  await expect(options.getByRole('button', { name: 'Leave intensity unrated' })).toHaveCount(0);
  await options.getByRole('button', { name: 'Maybe', exact: true }).click();
  await expect.poll(() => savedChoice(page)).toEqual({ decision: 'maybe', rating: null });
  await expect(magnet.getByText('Maybe', { exact: true })).toBeVisible();
  await magnet.getByRole('slider').fill('4');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Build sentence', exact: true }).click();
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal') ?? 'null')?.data?.entries?.[0]);
  expect(saved.feelings).toEqual([{ feeling: 'Anxiety', intensity: 4 }]);
  expect(saved.guidedSupport.terms).toEqual([{ label: 'Anxiety', role: 'feeling', decision: 'fits' }]);
});

test.describe('touch ownership', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('a native touch drag rates the feeling without picking up its magnet', async ({ page }) => {
    await openWords(page);
    const magnet = page.getByRole('group', { name: 'Anxiety controls', exact: true });
    const slider = magnet.getByRole('slider');
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    const before = (await magnet.boundingBox())!;
    const client = await page.context().newCDPSession(page);
    const y = box.y + box.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 12, y }] });
    for (const fraction of [.15, .3, .45, .6, .8]) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * fraction, y }] });
    const during = (await magnet.boundingBox())!;
    expect(Math.abs(during.x - before.x)).toBeLessThan(1);
    expect(Math.abs(during.y - before.y)).toBeLessThan(1);
    await expect(magnet).not.toHaveAttribute('data-picked-up');
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(Number(await slider.inputValue())).toBeGreaterThan(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await client.detach();
  });
});
