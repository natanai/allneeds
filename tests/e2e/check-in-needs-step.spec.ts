import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

async function startAtWords(page: Page) {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  await page.getByRole('radio', { name: 'All words', exact: true }).click();
}

async function keepWord(page: Page, word: string, intensity?: number) {
  await page.getByRole('searchbox', { name: 'Search feelings and other emotion words' }).fill(word);
  await page.getByRole('button', { name: new RegExp(`^${word}, (Feeling|Other emotion word)`) }).click();
  const sheet = page.getByRole('dialog', { name: word, exact: true });
  await sheet.getByRole('button', { name: 'Fits', exact: true }).click();
  if (intensity !== undefined) await sheet.getByRole('button', { name: `${word} intensity ${intensity} of 10`, exact: true }).click();
  await expect(sheet).toBeHidden();
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
  { width: 320, height: 568, largeText: true },
]) {
  test(`Needs is a separate step with explicit choices and feeling recap magnets at ${viewport.width}px${viewport.largeText ? ' with doubled text' : ''}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await startAtWords(page);
    if (viewport.largeText) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await keepWord(page, 'Calm', 5);
    await keepWord(page, 'Tired', 8);
    await keepWord(page, 'Gratitude');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'What matters to you here?', exact: true })).toBeFocused();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '5');
    await expect(page.getByRole('button', { name: 'Build sentence', exact: true })).toHaveCount(0);
    const suggestions = page.getByLabel('Possible Needs from your Feelings', { exact: true });
    await expect(suggestions.getByRole('button')).toHaveCount(8);
    await expect(page.getByText('0 selected', { exact: true })).toBeVisible();
    const rest = suggestions.getByRole('button', { name: 'Rest, possible Need, From Calm, Tired', exact: true });
    await expect(rest).toHaveAttribute('aria-pressed', 'false');
    await rest.click();
    await expect(suggestions.getByRole('button', { name: 'Rest, possible Need, From Calm, Tired, selected', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
    const picker = page.getByRole('dialog', { name: 'What matters to you here?', exact: true });
    await picker.getByRole('searchbox').fill('Understanding');
    await picker.getByRole('button', { name: 'Understanding', exact: true }).click();
    await picker.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByText('2 selected', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to your words', exact: true })).toBeInViewport();
    for (const name of ['Skip', 'Continue to your words']) {
      const bounds = await page.getByRole('button', { name, exact: true }).boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.getByRole('article').evaluate((element) => { element.scrollTop = 0; window.scrollTo(0, 0); });
    await page.screenshot({ path: `test-results/needs-step-${viewport.width}${viewport.largeText ? '-large' : ''}.png` });
    await page.getByRole('button', { name: 'Continue to your words', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your check-in', exact: true })).toBeFocused();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
    const recap = page.getByRole('region', { name: 'Your feeling words', exact: true });
    const wordBoard = recap.getByLabel('Selected feeling words; show descriptions', { exact: true });
    await expect(wordBoard).toHaveAttribute('data-ready', 'true');
    await expect(wordBoard.getByRole('switch')).toBeChecked();
    await expect(wordBoard.getByRole('button')).toHaveCount(3);
    const calm = wordBoard.getByRole('button', { name: 'Calm, Feeling, Fits · Intensity 5/10, show description', exact: true });
    await expect(calm).toBeVisible();
    await expect(wordBoard.getByRole('button', { name: 'Tired, Feeling, Fits · Intensity 8/10, show description', exact: true })).toBeVisible();
    await expect(wordBoard.getByRole('button', { name: 'Gratitude, Other emotion word, Fits, show description', exact: true })).toBeVisible();
    await calm.focus();
    await page.keyboard.press('Enter');
    const preview = page.getByRole('dialog', { name: 'Calm', exact: true });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole('group', { name: 'Does Calm fit?', exact: true })).toHaveCount(0);
    await expect(preview.getByRole('button', { name: 'Fits', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(calm).toBeFocused();
    await expect(page.getByRole('button', { name: /^Move .* (earlier|later)$/ })).toHaveCount(0);
    await page.getByRole('article').evaluate((element) => { element.scrollTop = 0; window.scrollTo(0, 0); });
    await page.screenshot({ path: `test-results/check-in-recap-${viewport.width}${viewport.largeText ? '-large' : ''}.png` });
    await page.getByRole('button', { name: 'Build sentence', exact: true }).click();
    const statement = page.getByRole('textbox', { name: 'Your statement', exact: true });
    await expect(statement).toHaveValue('I feel calm, I feel tired, and I feel gratitude because I need rest and understanding.');
    await statement.fill('These are my own words.');
    await page.getByRole('button', { name: 'Edit Needs', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'What matters to you here?', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Remove Understanding', exact: true }).click();
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
    await expect(statement).toHaveValue('These are my own words.');
    await expect(page.getByRole('button', { name: 'Rest, selected Need, open ways to support it', exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your check-in', exact: true })).toBeVisible();
    await expect(statement).toHaveValue('These are my own words.');
    await expect(calm).toBeVisible();
  });
}

test('Needs can be skipped with no word, without inventing a Need or losing history navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startAtWords(page);
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What matters to you here?', exact: true })).toBeVisible();
  await expect(page.getByText('No Need suggestions from these choices.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Build sentence', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your statement', exact: true })).toHaveValue('I’m not sure what I feel yet.');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'What matters to you here?', exact: true })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Possible words', exact: true })).toBeFocused();
  await page.goForward();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.alexithymia.draft')!).data.selectedNeeds)).toEqual([]);
});
