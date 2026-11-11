import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const draftKey = 'allneeds.v2.alexithymia.draft';
async function openWords(page: Page, query = 'Anxiety') {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  if (query) await page.getByRole('searchbox', { name: 'Search feelings and other emotion words', exact: true }).fill(query);
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
    await expect(slider).toHaveAttribute('aria-valuetext', 'Not selected');
    await expect(magnet).not.toContainText(/Not selected|Not rated|Very strong/);
    expect(await magnet.evaluate(el => getComputedStyle(el, '::after').backgroundImage)).toBe('none');
    await slider.fill('7');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(magnet.getByText('7', { exact: true })).toBeVisible();
    await expect(slider).toHaveAttribute('aria-valuetext', '7 out of 10, Fits');
    await expect(magnet.locator('[data-selected="true"]')).toBeVisible();
    await expect.poll(() => savedChoice(page)).toEqual({ decision: 'fits', rating: 7 });
    await slider.press('ArrowRight');
    await expect(slider).toHaveValue('8');
    await expect.poll(() => savedChoice(page)).toEqual({ decision: 'fits', rating: 8 });
    await slider.scrollIntoViewIfNeeded();
    const geometry = await slider.boundingBox();
    expect(geometry!.x).toBeGreaterThanOrEqual(0);
    expect(geometry!.x + geometry!.width).toBeLessThanOrEqual(viewport.width);
    expect(await slider.evaluate(el => (el as HTMLInputElement).offsetHeight)).toBeGreaterThanOrEqual(24);
    if (!viewport.largeText) {
      const strip = (await magnet.boundingBox())!;
      expect(strip.height).toBeLessThan(64);
      expect(strip.width).toBeGreaterThan(strip.height * 3);
    } else {
      expect(await magnet.getByText('Anxiety', { exact: true }).evaluate(el =>
        (el as HTMLElement).offsetHeight <= parseFloat(getComputedStyle(el).lineHeight) + 1,
      )).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await magnet.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/inline-feeling-${viewport.width}${viewport.largeText ? '-large' : ''}.png` });
    await page.reload();
    await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Possible words', exact: true })).toBeFocused();
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
  await expect(page.getByText('1 matching word is dismissed for this check-in. Use Show dismissed words to restore it.', { exact: true })).toBeVisible();
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
  expect(Number(await slider.inputValue())).toBeGreaterThan(0);
  const during = (await magnet.boundingBox())!;
  expect(Math.abs(during.x - before.x)).toBeLessThan(1);
  expect(Math.abs(during.y - before.y)).toBeLessThan(1);
  await expect(magnet).not.toHaveAttribute('data-picked-up');
  await page.mouse.up();
  const rating = await slider.inputValue();
  expect(Number(rating)).toBeGreaterThan(0);
  const handle = magnet.locator('[data-magnet-handle]');
  const handleBox = (await handle.boundingBox())!;
  const origin = await magnet.evaluate(el => ({ x: parseFloat((el as HTMLElement).style.getPropertyValue('--magnet-x')), y: parseFloat((el as HTMLElement).style.getPropertyValue('--magnet-y')) }));
  const limits = await magnet.evaluate(el => ({ x: el.parentElement!.clientWidth - (el as HTMLElement).offsetWidth, y: el.parentElement!.clientHeight - (el as HTMLElement).offsetHeight }));
  await page.mouse.move(handleBox.x + 12, handleBox.y + 12);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + 40, handleBox.y + 37, { steps: 6 });
  const moved = await magnet.evaluate(el => ({ x: parseFloat((el as HTMLElement).style.getPropertyValue('--magnet-x')), y: parseFloat((el as HTMLElement).style.getPropertyValue('--magnet-y')) }));
  expect(moved.x - origin.x).toBeGreaterThan(20);
  expect(moved.x).toBeCloseTo(Math.min(limits.x, origin.x + 28), 0);
  expect(moved.y).toBeCloseTo(Math.min(limits.y, origin.y + 25), 0);
  await page.mouse.up();
  await expect(slider).toHaveValue(rating);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('manual Maybe stays tentative, while direct rating transfers to Journal without another confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWords(page);
  const magnet = page.getByRole('group', { name: 'Anxiety controls', exact: true });
  const label = magnet.getByRole('button', { name: /^Anxiety, Feeling/ });
  await label.click();
  const preview = page.getByRole('dialog', { name: 'Anxiety', exact: true });
  await expect(preview).toBeVisible();
  await page.keyboard.press('Escape');
  await label.focus();
  await label.press('Enter');
  await expect(preview).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(label).toBeFocused();
  await expect(magnet.getByRole('slider')).toHaveValue('0');
  await magnet.getByRole('slider').fill('9');
  await magnet.getByRole('button', { name: 'Options for Anxiety', exact: true }).click();
  const options = page.getByRole('dialog', { name: 'Anxiety', exact: true });
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
  test('other words stay out of the main board and can be kept with one tap', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('nvcApp.theme', JSON.stringify({
      preset: 'Square monochrome', updatedAt: 123, roundness: 0,
      values: { primary: '#303030', quiet: '#FFFFFF', text: '#171717', secondary: '#303030', outline: '#171717', action: '#FFFFFF', positive: '#FFFFFF', attention: '#FFFFFF', selection: '#FFFFFF' },
    })));
    await openWords(page, '');
    const disclosure = page.locator('summary').filter({ hasText: /^Other words$/ });
    const otherBoard = page.getByLabel('Other word choices', { exact: true });
    await expect(disclosure).toBeInViewport();
    await expect(otherBoard).toHaveCount(0);
    const afraid = page.getByRole('group', { name: 'Afraid controls', exact: true });
    await expect(afraid).toBeInViewport();
    await expect(page.getByRole('group', { name: 'Angry controls', exact: true })).toBeInViewport();
    await afraid.getByRole('slider').fill('4');
    await page.screenshot({ path: 'test-results/compact-feelings-square-phone.png' });
    await afraid.getByRole('slider').fill('0');
    await disclosure.press('Enter');
    await expect(otherBoard).toBeVisible();
    await disclosure.press('Enter');
    await expect(otherBoard).toHaveCount(0);

    await page.getByRole('searchbox').fill('Abandoned');
    const magnet = otherBoard.getByRole('group', { name: 'Abandoned controls', exact: true });
    const label = magnet.getByRole('button', { name: 'Abandoned, Faux Feeling', exact: true });
    await expect(label).toHaveAttribute('aria-pressed', 'false');
    await expect(magnet.getByRole('slider')).toHaveCount(0);
    await expect(magnet).not.toContainText(/Keep word|Faux Feeling/);
    expect(await magnet.evaluate(el => (el as HTMLElement).offsetHeight)).toBeLessThanOrEqual(68);
    await label.tap();
    await expect(label).toHaveAttribute('aria-pressed', 'true');
    await expect(magnet.locator('[data-selected="true"]')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('1 word selected', { exact: true })).toBeVisible();
    await magnet.getByRole('button', { name: 'Options for Abandoned', exact: true }).tap();
    const sheet = page.getByRole('dialog', { name: 'Abandoned', exact: true });
    await expect(sheet.getByText('Faux Feeling', { exact: true })).toBeVisible();
    await sheet.getByRole('button', { name: 'Close Abandoned', exact: true }).tap();
    await page.getByRole('radio', { name: 'My words', exact: true }).tap();
    await expect(label).toHaveAttribute('aria-pressed', 'true');
    await label.press('Space');
    await expect(magnet).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continue without a word', exact: true })).toBeVisible();
  });

  test('native touch drags rate on the slider and move on the label', async ({ page }) => {
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
    const rating = await slider.inputValue();
    expect(Number(rating)).toBeGreaterThan(0);
    const label = (await magnet.locator('[data-magnet-handle]').boundingBox())!;
    const x = label.x + label.width / 2;
    const labelY = label.y + label.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: labelY }] });
    for (const dx of [8, 16, 24, 32]) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx, y: labelY + 12 }] });
    await expect(magnet).toHaveAttribute('data-picked-up', 'true');
    expect((await magnet.boundingBox())!.x - before.x).toBeGreaterThan(20);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(slider).toHaveValue(rating);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await client.detach();
  });
});

test('the mobile Words footer stays reachable as the viewport changes and the board scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 740 });
  await openWords(page, '');
  const scroller = page.getByRole('region', { name: 'Possible words', exact: true });
  await expect(scroller.getByRole('heading', { name: 'Possible words', exact: true })).toBeFocused();
  const slider = scroller.getByRole('slider', { name: 'Sad intensity', exact: true });
  await slider.scrollIntoViewIfNeeded();
  await slider.fill('4');
  await expect.poll(() => scroller.evaluate(el => el.scrollTop)).toBeGreaterThan(100);

  const next = page.getByRole('button', { name: 'Continue', exact: true });
  for (const height of [641, 740]) {
    await page.setViewportSize({ width: 393, height });
    await expect(next).toBeInViewport({ ratio: 1 });
    await expect.poll(async () => {
      const [body, footer] = await Promise.all([scroller.boundingBox(), next.locator('..').boundingBox()]);
      return Boolean(body && footer && body.y + body.height <= footer.y + 1
        && Math.abs(footer.y + footer.height - height) <= 1);
    }).toBe(true);
  }
  await page.screenshot({ path: 'test-results/words-phone-scrolled.png' });
  await next.click();
  await expect(page.getByRole('heading', { name: 'What matters to you here?', exact: true })).toBeFocused();
});

for (const width of [390, 1280]) {
  test(`matched Feelings stay compact and keep scores in options at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/alexithymia-support');
    await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
    await page.getByRole('button', { name: /^Body clues/ }).click();
    const clues = page.getByRole('dialog', { name: 'Body clues', exact: true });
    await clues.getByRole('slider', { name: 'Tight or constricted intensity', exact: true }).fill('5');
    await clues.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
    const board = page.getByLabel('Possible words', { exact: true });
    const anxiety = board.getByRole('group', { name: 'Anxiety controls', exact: true });
    await expect(board.getByRole('switch')).toBeChecked();
    await anxiety.getByRole('slider').fill('7');
    await expect(anxiety.getByRole('button', { name: /^Anxiety, Feeling.*100% clue match/ })).toBeVisible();
    await expect(anxiety).not.toContainText(/clue match|Fits|Not rated/);
    await expect(anxiety.getByText('7', { exact: true })).toBeVisible();
    await anxiety.getByRole('button', { name: 'Options for Anxiety', exact: true }).click();
    const options = page.getByRole('dialog', { name: 'Anxiety', exact: true });
    await expect(options.getByText('100% body clue match', { exact: true })).toBeVisible();
    const fullSlider = options.getByRole('slider', { name: 'Anxiety intensity' });
    expect(await fullSlider.evaluate(el => (el as HTMLInputElement).offsetHeight)).toBeGreaterThanOrEqual(44);
    await options.getByRole('button', { name: 'Close Anxiety', exact: true }).click();
    await board.getByRole('group', { name: 'Fear controls', exact: true }).getByRole('slider').fill('2');
    await page.getByRole('region', { name: 'Possible words', exact: true }).evaluate(el => { el.scrollTop = 0; window.scrollTo(0, 0); });
    await page.screenshot({ path: `test-results/inline-matched-feelings-${width}.png` });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('2 words selected', { exact: true })).toBeVisible();
  });
}
