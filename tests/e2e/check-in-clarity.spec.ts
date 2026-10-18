import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function start(page: Page, observation = '') {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  if (observation) await page.getByRole('textbox', { name: 'What happened?', exact: true }).fill(observation);
}
async function clues(page: Page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
async function words(page: Page) {
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
}
async function maybeFear(page: Page) {
  await page.getByRole('radio', { name: 'All words', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search feelings and other emotion words' }).fill('Fear');
  await page.getByRole('button', { name: /^Fear, Feeling/ }).click();
  await page.getByRole('dialog', { name: 'Fear', exact: true }).getByRole('button', { name: 'Maybe', exact: true }).click();
}

test('observation help and word previews stay in the check-in; Skip preserves writing; browser history follows steps', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const observation = 'I noticed anxiety when the meeting ended.';
  await start(page, observation);
  await expect(page.getByRole('heading', { name: 'Keep it concrete', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Get help describing what happened' }).click();
  const help = page.getByRole('dialog', { name: 'Writing tips', exact: true });
  await expect(help).toBeVisible();
  await expect(help.getByRole('heading')).toHaveCount(1);
  await expect(help.getByRole('button')).toHaveCount(1);
  await expect(help.getByRole('link', { name: 'Observations guide', exact: true })).toBeVisible();
  await expect(help).toContainText('They closed the laptop.');
  await expect(help).toContainText('Your own feelings can stay in the text too.');
  await expect(help).toContainText('Leaves check-in');
  await expect(help).not.toContainText('Quick Check only suggests details');
  await expect(page).toHaveURL(/alexithymia-support$/);
  await help.getByRole('button', { name: 'Close Writing tips', exact: true }).click();
  await page.getByRole('button', { name: /^Anxiety\s*Feeling$/ }).click();
  const preview = page.getByRole('dialog', { name: 'Anxiety', exact: true });
  await expect(preview.getByRole('button', { name: 'Fits', exact: true })).toHaveCount(0);
  await preview.getByRole('button', { name: 'Close Anxiety' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await words(page);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'What can you notice right now?' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue(observation);
  await page.getByRole('button', { name: 'Clear observation' }).click();
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toBeEmpty();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue(observation);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
  { width: 320, height: 568, largeText: true },
]) {
  test(`compact observation help contains focus and dismisses without leaving at ${viewport.width}px${viewport.largeText ? ' with doubled text' : ''}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const observation = 'They closed the laptop.';
    await start(page, observation);
    if (viewport.largeText) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });

    const trigger = page.getByRole('button', { name: 'Get help describing what happened', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    const help = page.getByRole('dialog', { name: 'Writing tips', exact: true });
    const close = help.getByRole('button', { name: 'Close Writing tips', exact: true });
    const reference = help.getByRole('link', { name: 'Observations guide', exact: true });
    await expect(close).toBeFocused();
    await expect(reference).toHaveAttribute('href', '/observations');
    await expect(reference).toHaveAccessibleDescription('Leaves check-in');
    await expect(help.getByRole('heading')).toHaveCount(1);
    await expect(help.getByRole('button')).toHaveCount(1);
    await expect(help.getByRole('link')).toHaveCount(1);
    await expect(help.locator('[class*="handle"]')).toHaveCount(0);

    await page.keyboard.press('Tab');
    await expect(reference).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(reference).toBeFocused();

    const panel = await help.boundingBox();
    const link = await reference.boundingBox();
    expect(panel).not.toBeNull();
    expect(panel!.x).toBeGreaterThanOrEqual(0);
    expect(panel!.x + panel!.width).toBeLessThanOrEqual(viewport.width);
    expect(panel!.y).toBeGreaterThan(0);
    expect(panel!.y + panel!.height).toBeLessThan(viewport.height);
    expect(link!.height).toBeGreaterThanOrEqual(44);
    expect(link!.x + link!.width).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/compact-observation-help-${viewport.width}${viewport.largeText ? '-large-text' : ''}.png` });

    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.press('Enter');
    await close.click();
    await expect(trigger).toBeFocused();
    await trigger.press('Enter');
    await expect(help).toBeVisible();
    await page.mouse.click(1, 1);
    await expect(help).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page).toHaveURL(/alexithymia-support$/);
    await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue(observation);
  });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 1280, height: 900 }]) {
  test(`explicit Observations exit preserves both drafts and returns to the same check-in at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const separateObservation = 'The window was open when I arrived.';
    const checkInObservation = 'The clock showed 3 p.m. when the meeting ended.';
    await page.goto('/observations');
    await page.getByRole('textbox', { name: 'What did you notice?' }).fill(separateObservation);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.observation.draft') ?? 'null')?.data?.text)).toBe(separateObservation);
    await start(page, checkInObservation);
    const helpButton = page.getByRole('button', { name: 'Get help describing what happened' });
    await helpButton.scrollIntoViewIfNeeded();
    const scrollPosition = () => page.evaluate(() => {
      const workspace = document.querySelector('article[aria-label^="Alexithymia support:"]')!;
      return getComputedStyle(workspace).position === 'fixed' ? workspace.scrollTop : window.scrollY;
    });
    await helpButton.click();
    const help = page.getByRole('dialog', { name: 'Writing tips', exact: true });
    await expect(help).toContainText('Leaves check-in');
    const originalScroll = await scrollPosition();
    await help.getByRole('link', { name: 'Observations guide', exact: true }).click();
    await expect(page).toHaveURL(/\/observations$/);
    await expect(page.getByRole('textbox', { name: 'What did you notice?' })).toHaveText(separateObservation);
    await page.getByRole('link', { name: 'Return to check-in', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue(checkInObservation);
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    await expect.poll(async () => Math.abs(await scrollPosition() - originalScroll)).toBeLessThanOrEqual(2);
    await expect(page.getByRole('button', { name: 'Continue previous check-in', exact: true })).toHaveCount(0);
  });
}

test('mobile body-area chooser and all-cues view never leave the check-in; explicit clearing has undo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page); await clues(page);
  await page.getByRole('button', { name: /^Body clues/ }).click();
  const body = page.getByRole('dialog', { name: 'Body clues', exact: true });
  const chooser = body.getByRole('combobox', { name: 'Body area', exact: true });
  await expect(chooser).toBeVisible();
  await expect(chooser.locator('option')).toHaveCount(9);
  await chooser.selectOption({ label: 'Whole-body sense' });
  await body.getByRole('button', { name: /^Muted or numb/ }).click();
  await body.getByRole('button', { name: 'All body cues', exact: true }).click();
  await expect(chooser).toHaveValue('all');
  await expect(body.locator('section[aria-labelledby^="alex-region-"]')).toHaveCount(9);
  await expect(page).toHaveURL(/alexithymia-support$/);
  await body.getByRole('button', { name: /^Tight or constricted/ }).click();
  await page.screenshot({ path: 'test-results/check-in-mobile-body.png' });
  await body.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Body clues 2 cues selected.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Body clues/ }).click();
  await expect(chooser).toHaveValue('overall');
  await body.getByRole('button', { name: 'Clear body clues', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Body clues 2 cues selected.', exact: true })).toBeVisible();
});

test('Maybe, generated updates, personal edits, Need clearing, and replacement undo stay coherent', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page); await clues(page); await words(page); await maybeFear(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const statement = page.getByRole('textbox', { name: 'Your statement', exact: true });
  await page.getByRole('button', { name: 'Build sentence', exact: true }).click();
  await expect(statement).toHaveValue('I might feel fear.');
  await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
  const needs = page.getByRole('dialog', { name: 'What matters to you here?', exact: true });
  await expect(needs.getByRole('searchbox')).not.toBeFocused();
  await needs.getByRole('searchbox').fill('Safety');
  await needs.getByRole('button', { name: 'Safety', exact: true }).click();
  await needs.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(statement).toHaveValue('I might feel fear because I need safety.');
  const ownWords = 'I want to keep these exact words.';
  await statement.fill(ownWords);
  await page.getByRole('button', { name: 'Edit Needs', exact: true }).click();
  await needs.getByRole('button', { name: 'Clear selected Needs' }).click();
  await expect(statement).toHaveValue(ownWords);
  await expect(page.getByText('Your choices changed.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Update draft', exact: true }).click();
  await page.getByRole('button', { name: 'Keep my wording', exact: true }).click();
  await expect(statement).toHaveValue(ownWords);
  await page.getByRole('button', { name: 'Update draft', exact: true }).click();
  await page.getByRole('button', { name: 'Replace with this draft', exact: true }).click();
  await expect(statement).toHaveValue('I might feel fear.');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(statement).toHaveValue(ownWords);
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await expect(journal.getByRole('textbox', { name: 'Reflection', exact: true })).toHaveValue(ownWords);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal.draft') ?? 'null')?.data?.guidedSupport?.terms[0]?.decision)).toBe('maybe');
});

test('uncertainty-only check-in reaches Journal and saves without invented words, prose, or ratings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page); await clues(page); await words(page);
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your statement', exact: true })).toBeEmpty();
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await expect(journal.getByRole('textbox', { name: 'Reflection', exact: true })).toBeEmpty();
  await expect(journal.getByRole('link', { name: 'Return to check-in' })).toBeVisible();
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Journal entry saved to this device.', { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal') ?? 'null')?.data?.entries[0]);
  expect(saved.notes).toBe('');
  expect(saved.feelings).toEqual([]);
  expect(saved.mood).toBeUndefined();
  expect(saved.guidedSupport.noWordYet).toBe(true);
});

test('an occupied Journal draft has a direct recovery route and never gets overwritten', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/inventory/journal?compose=new');
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await journal.getByRole('textbox', { name: 'Reflection', exact: true }).fill('Keep this first unfinished page.');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal.draft') ?? 'null')?.data?.notes)).toBe('Keep this first unfinished page.');
  await start(page); await clues(page); await words(page);
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  await page.getByRole('button', { name: 'Open unfinished Journal', exact: true }).click();
  await expect(journal.getByRole('textbox', { name: 'Reflection', exact: true })).toHaveValue('Keep this first unfinished page.');
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What fits right now?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  await expect(journal.getByRole('textbox', { name: 'Reflection', exact: true })).toBeEmpty();
});

test('search stays scoped, radios support arrows, and Unicode words remain distinct after reload', async ({ page }) => {
  await start(page); await clues(page); await words(page); await maybeFear(page);
  const search = page.getByRole('searchbox', { name: 'Search feelings and other emotion words' });
  await page.getByRole('radio', { name: 'My words', exact: true }).click();
  await search.fill('Anxiety');
  await expect(page.getByRole('button', { name: /^Anxiety, Feeling/ })).toHaveCount(0);
  await expect(page.getByText('No words in this view match', { exact: false })).toBeVisible();
  await page.getByRole('radio', { name: 'My words', exact: true }).press('ArrowLeft');
  await expect(page.getByRole('radio', { name: 'All words', exact: true })).toHaveAttribute('aria-checked', 'true');
  for (const word of ['😶', '😕', '不安']) {
    await search.fill(word);
    await page.getByRole('button', { name: `Use “${word}” as my word`, exact: true }).click();
    const detail = page.getByRole('dialog', { name: word, exact: true });
    await expect(detail.getByText('Choose body clues', { exact: false })).toHaveCount(0);
    await detail.getByRole('button', { name: 'Fits', exact: true }).click();
  }
  await page.getByRole('radio', { name: 'My words', exact: true }).click();
  await search.fill('😕');
  await page.reload();
  await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'My words', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(search).toHaveValue('😕');
  await expect(page.getByRole('button', { name: '😕, Your word, Fits', exact: true })).toBeVisible();
});

test('the full Body Cues handoff applies explicitly and leaves the independent tool draft intact', async ({ page }) => {
  await page.goto('/feelings/body-cues');
  await page.getByRole('slider', { name: 'Tight or constricted intensity', exact: true }).fill('15');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.body-cues.draft') ?? 'null')?.data?.selected['chest-tight'])).toBe(15);
  await start(page); await clues(page);
  await page.getByRole('button', { name: /^Body clues/ }).click();
  let body = page.getByRole('dialog', { name: 'Body clues', exact: true });
  await body.getByRole('button', { name: /^Tight or constricted/ }).click();
  await body.getByRole('slider', { name: 'Tight or constricted intensity', exact: true }).fill('70');
  await body.getByText('Separate Body Cues tool', { exact: true }).click();
  await body.getByRole('button', { name: 'Open separate Body Cues tool', exact: true }).click();
  await expect(page).toHaveURL(/\/feelings\/body-cues$/);
  await expect(body).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Tight or constricted intensity', exact: true })).toHaveValue('70');
  await page.getByRole('slider', { name: 'Tight or constricted intensity', exact: true }).fill('80');
  await page.getByRole('button', { name: 'Use these clues in check-in', exact: true }).click();
  await expect(page.getByText('Tight or constricted · 80%', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.body-cues.draft') ?? 'null')?.data?.selected['chest-tight'])).toBe(15);
  await page.getByRole('button', { name: /^Body clues/ }).click();
  body = page.getByRole('dialog', { name: 'Body clues', exact: true });
  await body.getByText('Separate Body Cues tool', { exact: true }).click();
  await body.getByRole('button', { name: 'Open separate Body Cues tool', exact: true }).click();
  await expect(page).toHaveURL(/\/feelings\/body-cues$/);
  await expect(body).toHaveCount(0);
  await page.getByRole('slider', { name: 'Tight or constricted intensity', exact: true }).fill('85');
  await page.getByRole('link', { name: 'Return to check-in', exact: true }).click();
  await expect(page.getByText('Tight or constricted · 80%', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: /^Body clues/ }).click();
  await body.getByText('Separate Body Cues tool', { exact: true }).click();
  await body.getByRole('button', { name: 'Open separate Body Cues tool', exact: true }).click();
  await expect(page).toHaveURL(/\/feelings\/body-cues$/);
  await expect(body).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Tight or constricted intensity', exact: true })).toHaveValue('85');
  await page.getByRole('link', { name: 'Return to check-in', exact: true }).click();
  await page.getByRole('button', { name: /^Body clues/ }).click();
  await body.getByRole('slider', { name: 'Tight or constricted intensity', exact: true }).fill('95');
  await body.getByText('Separate Body Cues tool', { exact: true }).click();
  await body.getByRole('button', { name: 'Open separate Body Cues tool', exact: true }).click();
  await expect(page).toHaveURL(/\/feelings\/body-cues$/);
  await expect(body).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Tight or constricted intensity', exact: true })).toHaveValue('95');
});

test('the check-in return action survives following another canonical reference', async ({ page }) => {
  await start(page); await clues(page); await words(page);
  await page.getByRole('searchbox', { name: 'Search feelings and other emotion words' }).fill('Anxiety');
  await page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  await page.getByRole('dialog', { name: 'Anxiety', exact: true }).getByRole('link', { name: 'Open full Feeling page', exact: true }).click();
  await expect(page).toHaveURL(/feelings\/anxiety$/);
  await page.getByRole('region', { name: 'Related needs', exact: true }).getByRole('link').first().click();
  await expect(page).toHaveURL(/needs\/[^/]+$/);
  await page.getByRole('link', { name: 'Return to check-in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Possible words', exact: true })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search feelings and other emotion words' })).toHaveValue('Anxiety');
});

test('long mobile stages reset their own scroller; canonical Need references return to the same review', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await start(page); await clues(page); await words(page); await maybeFear(page);
  await page.getByRole('radio', { name: 'All words', exact: true }).click();
  const workspace = page.locator('article[aria-label^="Alexithymia support:"]');
  await workspace.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(page.getByRole('heading', { name: 'What fits right now?', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'What matters to you here?', exact: true });
  await picker.getByRole('searchbox').fill('Safety');
  await picker.getByRole('button', { name: 'Safety', exact: true }).click();
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Safety, selected Need, open ways to support it', exact: true }).click();
  await expect(page).toHaveURL(/needs\/safety$/);
  await page.getByRole('link', { name: 'Return to check-in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What fits right now?', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Safety, selected Need, open ways to support it', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/check-in-mobile-review.png' });
});

test('unavailable draft storage is reported and reference navigation cannot discard the in-memory check-in', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'allneeds.v2.alexithymia.draft') throw new DOMException('Full', 'QuotaExceededError');
      original.call(this, key, value);
    };
  });
  await start(page, 'Keep this in-memory observation.');
  await expect(page.getByRole('alert')).toContainText('could not be kept');
  await page.getByRole('button', { name: 'Get help describing what happened' }).click();
  const help = page.getByRole('dialog', { name: 'Writing tips', exact: true });
  await help.getByRole('link', { name: 'Observations guide', exact: true }).click();
  await expect(page).toHaveURL(/alexithymia-support$/);
  await help.getByRole('button', { name: 'Close Writing tips', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue('Keep this in-memory observation.');
  await page.getByRole('button', { name: 'Close check-in', exact: true }).click();
  await expect(page).toHaveURL(/alexithymia-support$/);
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue('Keep this in-memory observation.');
});

for (const viewport of [{ width: 320, height: 568 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
  test(`body areas and continuation remain reachable at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await start(page); await clues(page);
    await page.getByRole('button', { name: /^Body clues/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Body clues', exact: true });
    if (viewport.width < 720) {
      await sheet.getByRole('combobox', { name: 'Body area', exact: true }).selectOption('overall');
    } else {
      await sheet.getByRole('navigation', { name: 'Body regions' }).getByRole('button', { name: 'Whole-body sense', exact: true }).click();
    }
    await expect(sheet.getByRole('heading', { name: 'Whole-body sense', exact: true })).toBeVisible();
    await sheet.getByRole('button', { name: 'Nothing clear in my body', exact: true }).click();
    await words(page);
    await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
    await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
    await page.getByRole('dialog', { name: 'What matters to you here?', exact: true }).getByRole('button', { name: 'Done', exact: true }).click();
    const continueButton = page.getByRole('button', { name: 'Continue in Journal', exact: true });
    if (viewport.width >= 720) await continueButton.scrollIntoViewIfNeeded();
    await expect(continueButton).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
}

test('clear words is separate from continuing, and undo restores the decision and reported rating', async ({ page }) => {
  await start(page); await clues(page); await words(page);
  const search = page.getByRole('searchbox', { name: 'Search feelings and other emotion words' });
  await search.fill('Fear');
  await page.getByRole('button', { name: /^Fear, Feeling/ }).click();
  const detail = page.getByRole('dialog', { name: 'Fear', exact: true });
  await detail.getByRole('button', { name: 'Fits', exact: true }).click();
  await detail.getByRole('button', { name: 'Fear intensity 7 of 10', exact: true }).click();
  await page.getByRole('button', { name: 'Clear selected words', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue without a word', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('Fits · 7/10', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Feeling · Fits · Intensity 7/10', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Fear', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue in Journal', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Journal', exact: true }).getByRole('textbox', { name: 'Reflection', exact: true })).toBeEmpty();
});

test('optional scales describe their meanings and unavailable speech gives useful feedback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'speechSynthesis', { value: undefined }));
  await start(page); await clues(page);
  await page.getByRole('button', { name: /^Overall feeling/ }).click();
  const shape = page.getByRole('dialog', { name: 'Overall feeling', exact: true });
  await expect(shape.locator('input[name="alex-shape-power"]').first()).toHaveAccessibleDescription('Less able to influence this More able to influence this');
  await shape.getByRole('button', { name: 'Mixed feelings', exact: true }).click();
  await shape.getByRole('button', { name: 'Done', exact: true }).click();
  await words(page);
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your statement', exact: true }).fill('My own words.');
  await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Read aloud is unavailable' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await journal.locator('summary').filter({ hasText: 'Emotional coordinates' }).click();
  await expect(journal.getByRole('button', { name: 'Mixed feelings', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal.draft') ?? 'null')?.data?.mood)).toEqual({ kind: 'mixed' });
});

test('read aloud toggles to Stop, ignores old completions, and stops on edits or leaving', async ({ page }) => {
  type SpeechTrace = {
    texts: string[];
    cancellations: number;
    end: (index: number) => void;
    fail: (index: number) => void;
  };
  type SpeechTestWindow = Window & { speechTrace: SpeechTrace };
  await page.addInitScript(() => {
    const completions: Array<() => void> = [];
    const failures: Array<() => void> = [];
    const trace = { texts: [] as string[], cancellations: 0,
      end: (index: number) => completions[index]?.(),
      fail: (index: number) => failures[index]?.(),
    };
    Object.defineProperty(window, 'speechTrace', { value: trace });
    Object.defineProperty(window, 'speechSynthesis', { value: {
      cancel: () => { trace.cancellations += 1; },
      speak: (utterance: SpeechSynthesisUtterance) => {
        trace.texts.push(utterance.text);
        const end = utterance.onend;
        const error = utterance.onerror;
        // Retain callbacks to simulate a delayed event from a stopped reading.
        completions.push(() => end?.call(utterance, new Event('end') as SpeechSynthesisEvent));
        failures.push(() => {
          const event = new Event('error');
          Object.defineProperty(event, 'error', { value: 'synthesis-failed' });
          error?.call(utterance, event as SpeechSynthesisErrorEvent);
        });
      },
    } });
  });
  await start(page); await clues(page); await words(page);
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  const statement = page.getByRole('textbox', { name: 'Your statement', exact: true });
  await statement.fill('Read this synthetic statement.');
  const read = page.getByRole('button', { name: 'Read aloud', exact: true });
  const stop = page.getByRole('button', { name: 'Stop reading', exact: true });
  const trace = () => page.evaluate(() => {
    const state = (window as SpeechTestWindow).speechTrace;
    return { texts: state.texts, cancellations: state.cancellations };
  });
  await read.click();
  await expect(stop).toBeVisible();
  await stop.click();
  await expect(read).toBeVisible();
  expect((await trace()).texts).toEqual(['Read this synthetic statement.']);
  expect((await trace()).cancellations).toBe(2);
  await expect(page.getByRole('status').filter({ hasText: 'Reading stopped.' })).toBeVisible();
  await read.click();
  await page.evaluate(() => (window as SpeechTestWindow).speechTrace.end(0));
  await expect(stop).toBeVisible();
  await page.evaluate(() => (window as SpeechTestWindow).speechTrace.end(1));
  await expect(read).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Finished reading' })).toBeVisible();
  await read.click();
  const beforeEdit = (await trace()).cancellations;
  await statement.fill('The edited statement.');
  await expect(read).toBeVisible();
  expect((await trace()).cancellations).toBe(beforeEdit + 1);
  await read.click();
  await page.evaluate(() => (window as SpeechTestWindow).speechTrace.fail(3));
  await expect(read).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Read aloud could not finish' })).toBeVisible();
  await read.click();
  const beforeBack = (await trace()).cancellations;
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Possible words', exact: true })).toBeVisible();
  expect((await trace()).cancellations).toBe(beforeBack + 1);
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  await read.click();
  const beforeExit = (await trace()).cancellations;
  await page.getByRole('button', { name: 'Close check-in', exact: true }).click();
  await expect(page).toHaveURL(/\/feelings$/);
  expect((await trace()).cancellations).toBe(beforeExit + 1);
});

test('an older tab cannot overwrite edits or a new check-in from another tab', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, 'The first screen.');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.alexithymia.draft') ?? 'null')?.data?.observation)).toBe('The first screen.');
  const other = await page.context().newPage();
  await other.bringToFront();
  await other.route('https://backend.allneeds.app/api/strategies/feed**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok","strategies":[]}' }));
  await other.goto('/alexithymia-support');
  await other.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  await other.getByRole('textbox', { name: 'What happened?', exact: true }).fill('The newer saved edit.');
  await expect.poll(() => other.evaluate(() => ({
    observation: JSON.parse(localStorage.getItem('allneeds.v2.alexithymia.draft') ?? 'null')?.data?.observation,
    alert: document.querySelector('[role="alert"]')?.textContent ?? null,
  }))).toEqual({ observation: 'The newer saved edit.', alert: null });
  await page.bringToFront();
  await page.getByRole('textbox', { name: 'What happened?', exact: true }).fill('Keep this older screen in memory.');
  await expect(page.getByRole('alert')).toContainText('changed in another tab');
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue('Keep this older screen in memory.');
  await other.bringToFront();
  await other.reload();
  other.once('dialog', (dialog) => dialog.accept());
  await other.getByRole('button', { name: 'Start new check-in', exact: true }).click();
  await other.getByRole('textbox', { name: 'What happened?', exact: true }).fill('A separate new check-in.');
  await expect.poll(() => other.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.alexithymia.draft') ?? 'null')?.data?.observation)).toBe('A separate new check-in.');
  await page.bringToFront();
  await page.getByRole('button', { name: 'Close check-in', exact: true }).click();
  await expect(page).toHaveURL(/alexithymia-support$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.alexithymia.draft') ?? 'null')?.data?.observation)).toBe('A separate new check-in.');
  await other.close();
});

test('doubling the base text size keeps narrow-phone choices and the Journal handoff usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/alexithymia-support');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  const noOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    const workspace = page.locator('article[aria-label^="Alexithymia support:"]');
    expect(await workspace.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    const appBar = workspace.locator(':scope > header');
    expect(await appBar.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    for (const icon of await appBar.locator('button svg').all()) {
      expect((await icon.boundingBox())?.width).toBeGreaterThanOrEqual(20);
    }
  };
  await noOverflow();
  await clues(page);
  await page.getByRole('button', { name: /^Body clues/ }).click();
  const body = page.getByRole('dialog', { name: 'Body clues', exact: true });
  const chooser = body.getByRole('combobox', { name: 'Body area', exact: true });
  await chooser.selectOption('overall');
  await body.getByRole('button', { name: /^Muted or numb/ }).click();
  await body.getByRole('button', { name: 'All body cues', exact: true }).click();
  expect(await body.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await body.getByRole('button', { name: 'Done', exact: true }).click();
  await noOverflow();
  await words(page);
  for (const view of await page.getByRole('radio').all()) {
    expect(await view.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }
  await maybeFear(page);
  await noOverflow();
  await page.getByRole('searchbox', { name: 'Search feelings and other emotion words' }).fill('Guilt');
  const otherWord = page.getByRole('button', { name: /^Guilt, Other emotion word/ });
  await otherWord.scrollIntoViewIfNeeded();
  const otherBadge = await otherWord.getByText('Other emotion word', { exact: true }).boundingBox();
  const otherFace = await otherWord.boundingBox();
  expect(otherBadge).not.toBeNull();
  expect(otherFace).not.toBeNull();
  expect(otherBadge!.x).toBeGreaterThanOrEqual(otherFace!.x - 1);
  expect(otherBadge!.x + otherBadge!.width).toBeLessThanOrEqual(otherFace!.x + otherFace!.width + 1);
  await otherWord.click();
  await page.getByRole('dialog', { name: 'Guilt', exact: true }).getByRole('button', { name: 'Maybe', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
  const needs = page.getByRole('dialog', { name: 'What matters to you here?', exact: true });
  await needs.getByRole('searchbox').fill('Safety');
  await needs.getByRole('button', { name: 'Safety', exact: true }).click();
  await needs.getByRole('button', { name: 'Done', exact: true }).click();
  await noOverflow();
  const selectedNeed = page.getByRole('button', { name: 'Safety, selected Need, open ways to support it', exact: true });
  await selectedNeed.scrollIntoViewIfNeeded();
  await expect.poll(() => selectedNeed.evaluate((element) => {
    const toggle = element.parentElement?.querySelector('[role="switch"]')?.closest('label');
    if (!toggle) throw new Error('The selected Need board must retain its physics control.');
    const magnet = element.getBoundingClientRect();
    const control = toggle.getBoundingClientRect();
    return magnet.left < control.right && magnet.right > control.left && magnet.top < control.bottom && magnet.bottom > control.top;
  })).toBe(false);
  await selectedNeed.click();
  await page.getByRole('link', { name: 'Return to check-in', exact: true }).click();
  await expect(selectedNeed).toBeVisible();
  await noOverflow();
  const actionText = await selectedNeed.getByText('Open ways to support this Need', { exact: true }).boundingBox();
  const roleBadge = await selectedNeed.getByText('Need', { exact: true }).boundingBox();
  expect(actionText).not.toBeNull();
  expect(roleBadge).not.toBeNull();
  expect(actionText!.x < roleBadge!.x + roleBadge!.width && actionText!.x + actionText!.width > roleBadge!.x
    && actionText!.y < roleBadge!.y + roleBadge!.height && actionText!.y + actionText!.height > roleBadge!.y).toBe(false);
  await expect(page.getByRole('button', { name: 'Continue in Journal', exact: true })).toBeInViewport();
  await page.screenshot({ path: 'test-results/check-in-large-base-text.png' });
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await expect(journal).toBeVisible();
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Journal entry saved to this device.', { exact: true })).toBeVisible();
});

test('keyboard-only completion keeps sheet focus contained and returns to the opening control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/alexithymia-support');
  const tabTo = async (target: Locator) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (await target.evaluate((element) => element === document.activeElement)) return;
      await page.keyboard.press('Tab');
    }
    await expect(target).toBeFocused();
  };
  await tabTo(page.getByRole('button', { name: 'Start check-in', exact: true }));
  await page.keyboard.press('Enter');
  await tabTo(page.getByRole('textbox', { name: 'What happened?', exact: true }));
  await page.keyboard.type('I want to keep this observation.');
  await tabTo(page.getByRole('button', { name: 'Continue', exact: true }));
  await page.keyboard.press('Enter');
  const bodyTrigger = page.getByRole('button', { name: /^Body clues/ });
  await tabTo(bodyTrigger);
  await page.keyboard.press('Enter');
  const body = page.getByRole('dialog', { name: 'Body clues', exact: true });
  await tabTo(body.getByRole('combobox', { name: 'Body area', exact: true }));
  await page.keyboard.press('End');
  await expect(body.getByRole('heading', { name: 'Whole-body sense', exact: true })).toBeVisible();
  await tabTo(body.getByRole('button', { name: /^Muted or numb/ }));
  await page.keyboard.press('Space');
  const separateTool = body.locator('summary').filter({ hasText: 'Separate Body Cues tool' });
  await tabTo(separateTool);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.keyboard.press('Tab');
    expect(await body.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await tabTo(separateTool);
  await page.keyboard.press('Enter');
  await tabTo(body.getByRole('button', { name: 'Open separate Body Cues tool', exact: true }));
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await body.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(bodyTrigger).toBeFocused();
  await expect(bodyTrigger).toHaveAccessibleName('Body clues 1 cue selected.');
  await tabTo(page.getByRole('button', { name: 'Continue to words', exact: true }));
  await page.keyboard.press('Enter');
  await tabTo(page.getByRole('button', { name: 'Continue without a word', exact: true }));
  await page.keyboard.press('Enter');
  const needsTrigger = page.getByRole('button', { name: 'Add Needs', exact: true });
  await tabTo(needsTrigger);
  await page.keyboard.press('Enter');
  const needs = page.getByRole('dialog', { name: 'What matters to you here?', exact: true });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.keyboard.press('Tab');
    expect(await needs.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(needsTrigger).toBeFocused();
  await tabTo(page.getByRole('button', { name: 'Continue in Journal', exact: true }));
  await page.keyboard.press('Enter');
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await tabTo(journal.getByRole('button', { name: 'Save', exact: true }));
  await page.keyboard.press('Enter');
  await expect(page.getByText('Journal entry saved to this device.', { exact: true })).toBeVisible();
});
