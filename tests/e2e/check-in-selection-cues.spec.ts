import type { Locator, Page } from '@playwright/test';

import { themePresets } from '../../src/features/customizer/themePresets';
import type { ThemePreset } from '../../src/features/customizer/themePresets';
import { expect, test } from './fixtures';

const flatLight: ThemePreset = {
  name: 'Equal light faces', roundness: 100,
  values: { primary: '#303030', quiet: '#FFFFFF', text: '#171717', secondary: '#303030', outline: '#171717', action: '#FFFFFF', positive: '#FFFFFF', attention: '#FFFFFF', selection: '#FFFFFF' },
};
const flatDark: ThemePreset = {
  name: 'Equal dark faces', roundness: 200, appearance: 'refrigerator',
  values: { primary: '#333333', quiet: '#222222', text: '#FFFFFF', secondary: '#EEEEEE', outline: '#FFFFFF', action: '#222222', positive: '#222222', attention: '#222222', selection: '#222222' },
};

async function seedTheme(page: Page, theme: ThemePreset) {
  await page.addInitScript((value) => localStorage.setItem('nvcApp.theme', JSON.stringify({
    ...value, preset: value.name, updatedAt: 123,
  })), theme);
}

async function start(page: Page) {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
}

function check(control: Locator) {
  return control.locator('[aria-hidden="true"]').filter({ hasText: '✓' });
}

async function size(control: Locator) {
  return control.evaluate((element) => ({ width: (element as HTMLElement).offsetWidth, height: (element as HTMLElement).offsetHeight }));
}

const scenarios = [
  ...themePresets.map((theme) => ({ theme, width: 390, height: 844, largeText: false })),
  { theme: flatLight, width: 390, height: 844, largeText: false },
  { theme: flatLight, width: 320, height: 568, largeText: true },
  { theme: { ...flatLight, name: 'Equal faces and outlines', values: { ...flatLight.values, outline: '#FFFFFF' } }, width: 1280, height: 900, largeText: false },
  { theme: flatDark, width: 1280, height: 900, largeText: false },
];

for (const scenario of scenarios) {
  test(`${scenario.theme.name}, ${scenario.width}px${scenario.largeText ? ', doubled text' : ''}: choices remain visible without color differences`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await seedTheme(page, scenario.theme);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await start(page);
    if (scenario.largeText) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });

    await page.getByRole('button', { name: /^Body clues/ }).click();
    const body = page.getByRole('dialog', { name: 'Body clues', exact: true });
    const sensation = body.getByRole('button', { name: /^Tight or constricted/ });
    await expect(sensation).toHaveAttribute('aria-pressed', 'false');
    await expect(sensation).toContainText('+');
    await sensation.click();
    await expect(check(sensation)).toBeVisible();
    await expect(sensation).toHaveAttribute('aria-pressed', 'true');
    if (scenario.width >= 720) {
      const currentArea = body.getByRole('navigation', { name: 'Body regions' }).getByRole('button', { pressed: true });
      await expect(currentArea).toHaveCSS('box-shadow', /inset/);
      await expect(currentArea.getByLabel('has selected cues')).toBeVisible();
    }
    await body.getByRole('button', { name: 'Done', exact: true }).click();

    await page.getByRole('button', { name: /^Overall feeling/ }).click();
    const shape = page.getByRole('dialog', { name: 'Overall feeling', exact: true });
    const mixed = shape.getByRole('button', { name: 'Mixed feelings', exact: true });
    const unsure = shape.getByRole('button', { name: 'Not sure', exact: true }).first();
    await expect(check(mixed)).toBeHidden();
    await expect(check(unsure)).toBeHidden();
    await mixed.focus();
    await mixed.press('Enter');
    await expect(check(mixed)).toBeVisible();
    if (scenario.largeText) {
      const alternatives = shape.getByRole('group', { name: 'Instead of a point', exact: true });
      expect(await alternatives.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth && Array.from(element.querySelectorAll('button')).every((button) => {
          const box = button.getBoundingClientRect();
          return box.left >= bounds.left - 1 && box.right <= bounds.right + 1 && button.scrollWidth <= button.clientWidth + 1;
        });
      })).toBe(true);
    }
    await expect(shape.locator('output')).toHaveText('Mixed feelings selected');
    await unsure.click();
    await expect(check(mixed)).toBeHidden();
    await expect(check(unsure)).toBeVisible();
    const point = shape.getByRole('button', { name: /^Place emotional point/ });
    await point.focus();
    await point.press('ArrowLeft');
    await expect(check(unsure)).toBeHidden();
    await expect(shape.getByText('Point selected', { exact: true })).toBeVisible();

    const power = shape.locator('fieldset').filter({ has: page.locator('input[name="alex-shape-power"]') });
    await expect(power.getByText('No rating selected', { exact: true })).toBeVisible();
    await expect(power.getByRole('button', { name: 'Not sure', exact: true })).not.toHaveAttribute('aria-pressed');
    const fifth = power.locator('input[value="1"]');
    await fifth.locator('..').click();
    await expect(fifth).toBeChecked();
    await expect(fifth.locator('+ span')).toHaveCSS('box-shadow', /inset/);
    await expect(power.getByText('Selected: 5 of 5', { exact: true })).toBeVisible();
    if (scenario.largeText) await page.screenshot({ path: 'test-results/selection-large-text-scale.png' });
    await fifth.focus();
    await fifth.press('ArrowLeft');
    await expect(power.getByText('Selected: 4 of 5', { exact: true })).toBeVisible();
    await power.getByRole('button', { name: 'Not sure', exact: true }).click();
    await expect(power.locator('input:checked')).toHaveCount(0);
    await expect(power.getByText('No rating selected', { exact: true })).toBeVisible();
    await shape.getByRole('button', { name: 'Done', exact: true }).click();

    await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
    const view = page.getByRole('radio', { name: 'Matches', exact: true });
    await expect(view).toHaveCSS('text-decoration-line', 'underline');
    const word = page.getByLabel('Possible words', { exact: true }).getByRole('button', { name: /^Anxiety, Feeling/ });
    await expect(word).not.toContainText(/Fits|Maybe/);
    await word.click();
    const candidate = page.getByRole('dialog', { name: 'Anxiety', exact: true });
    await candidate.getByRole('button', { name: 'Fits', exact: true }).click();
    await candidate.getByRole('button', { name: 'Anxiety intensity 6 of 10', exact: true }).click();
    await expect(word).toContainText('✓ Fits');
    await expect(word).toContainText(/% clue match/);
    if (scenario.largeText) {
      await word.scrollIntoViewIfNeeded();
      expect(await word.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: 'test-results/selection-large-text-word.png' });
    }
    await word.click();
    await expect(check(candidate.getByRole('button', { name: 'Fits', exact: true }))).toBeVisible();
    await candidate.getByRole('button', { name: 'Fits', exact: true }).click();
    await expect(check(candidate.getByRole('button', { name: 'Anxiety intensity 6 of 10', exact: true }))).toBeVisible();
    await candidate.getByRole('button', { name: 'Close Anxiety', exact: true }).click();
    await word.click();
    await candidate.getByRole('button', { name: 'Maybe', exact: true }).click();
    await expect(word).toContainText('Maybe');
    await expect(word).not.toContainText('✓');
    await word.click();
    await expect(check(candidate.getByRole('button', { name: 'Maybe', exact: true }))).toBeVisible();
    await candidate.getByRole('button', { name: 'Not this time', exact: true }).click();
    await expect(word).toHaveCount(0);
    await page.getByRole('radio', { name: 'All words', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search feelings and other emotion words', exact: true }).fill('Anxiety');
    await expect(word).toContainText('Not this time');
    await expect(word).not.toContainText('✓');
    await word.click();
    await candidate.getByRole('button', { name: 'Maybe', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
    const needs = page.getByRole('dialog', { name: 'What matters to you here?', exact: true });
    await needs.getByRole('searchbox').fill('Safety');
    const safety = needs.getByRole('button', { name: /^Safety/ });
    expect(await safety.evaluate((element) => getComputedStyle(element, '::before').backgroundColor === getComputedStyle(element).color)).toBe(true);
    await expect(safety).toHaveAttribute('aria-pressed', 'false');
    await expect(check(safety)).toBeHidden();
    const before = await size(safety);
    const face = await safety.evaluate((element) => getComputedStyle(element).backgroundColor);
    await safety.click();
    await expect(safety).toHaveAttribute('aria-pressed', 'true');
    await expect(check(safety)).toBeVisible();
    expect(await size(safety)).toEqual(before);
    if (scenario.theme.name.startsWith('Equal')) await expect(safety).toHaveCSS('background-color', face);
    await expect(needs.getByText('1 Need selected', { exact: true })).toBeVisible();
    await expect(needs.getByRole('switch')).toBeChecked();
    await safety.focus();
    await safety.press('Enter');
    await expect(check(safety)).toBeHidden();
    await safety.press('Space');
    await expect(check(safety)).toBeVisible();
    await safety.scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/selection-${scenario.theme.name.replaceAll(' ', '-')}-${scenario.width}.png` });
    await needs.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Needs', exact: true }).click();
    await expect(check(safety)).toBeVisible();
    await needs.getByRole('button', { name: 'Clear selected Needs', exact: true }).click();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Needs', exact: true }).click();
    await expect(check(safety)).toBeVisible();
    await needs.getByRole('button', { name: 'Done', exact: true }).click();
    expect(errors).toEqual([]);
  });
}

test('Observation provenance is not a selected word; partial comparisons and custom words still show the actual decision', async ({ page }) => {
  await seedTheme(page, flatLight);
  await page.goto('/observations');
  await page.getByRole('textbox', { name: 'What did you notice?' }).fill('I felt anxiety when I asked for support.');
  await page.getByRole('button', { name: 'Continue with check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: /^Body clues/ }).click();
  const body = page.getByRole('dialog', { name: 'Body clues', exact: true });
  await body.getByRole('button', { name: /^Tight or constricted/ }).click();
  await body.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: /^Overall feeling/ }).click();
  const shape = page.getByRole('dialog', { name: 'Overall feeling', exact: true });
  await shape.getByRole('button', { name: /^Place emotional point/ }).press('ArrowRight');
  await shape.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  const source = page.getByRole('button', { name: /^Anxiety, Feeling.*From your observation/ });
  await expect(source).not.toContainText(/✓|Fits|Maybe/);
  await source.click();
  await page.getByRole('dialog', { name: 'Anxiety', exact: true }).getByRole('button', { name: 'Maybe', exact: true }).click();
  await expect(source).toContainText('Maybe · From your observation');

  const partial = page.getByLabel('Words that cannot be compared with every clue', { exact: true }).locator('[data-magnet-id]').first();
  const partialId = await partial.getAttribute('data-magnet-id');
  await partial.click();
  const candidate = page.getByRole('dialog').last();
  await candidate.getByRole('button', { name: 'Maybe', exact: true }).click();
  await expect(page.locator(`[data-magnet-id="${partialId}"]`)).toContainText('Maybe · Some clues cannot be compared');

  await page.getByRole('radio', { name: 'All words', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search feelings and other emotion words', exact: true }).fill('My uncertain word');
  await page.getByRole('button', { name: 'Use “My uncertain word” as my word', exact: true }).click();
  await page.getByRole('dialog', { name: 'My uncertain word', exact: true }).getByRole('button', { name: 'Fits', exact: true }).click();
  await page.getByRole('radio', { name: 'My words', exact: true }).click();
  await expect(page.getByRole('button', { name: /^My uncertain word, Your word, Fits/ })).toContainText('✓ Fits');
});

test('a restored in-between scale rating is retained without inventing a checked position', async ({ page }) => {
  await seedTheme(page, flatLight);
  await page.addInitScript(() => {
    localStorage.setItem('allneeds.v2.alexithymia.draft', JSON.stringify({ schemaVersion: 2, savedAt: new Date().toISOString(), data: {
      checkInId: 'continuous-rating-check-in', updatedAt: new Date().toISOString(), stage: 2,
      observation: '', openRegion: 'chest', selectedCues: {}, bodyClear: false, shape: { power: .3 },
      decisions: {}, termOrder: [], customTerms: [], noWordYet: false, selectedNeeds: [], statement: '', statementEdited: false,
    } }));
  });
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  await page.getByRole('button', { name: /^Overall feeling/ }).click();
  const shape = page.getByRole('dialog', { name: 'Overall feeling', exact: true });
  const power = shape.locator('fieldset').filter({ has: page.locator('input[name="alex-shape-power"]') });
  await expect(power.getByText('Previous rating retained', { exact: true })).toBeVisible();
  await expect(power.locator('input:checked')).toHaveCount(0);
  const storedPower = () => page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.alexithymia.draft')!).data.shape.power);
  await expect.poll(storedPower).toBe(.3);
  await power.locator('input[value="0.25"]').locator('..').click();
  await expect(power.getByText('Selected: 2 of 5', { exact: true })).toBeVisible();
  await expect.poll(storedPower).toBe(.25);
});

test('a selected long Need keeps its check and full name inside the picker at 320px with doubled text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seedTheme(page, flatLight);
  await start(page);
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.getByRole('button', { name: 'Add Needs', exact: true }).click();
  const needs = page.getByRole('dialog', { name: 'What matters to you here?', exact: true });
  await needs.getByRole('searchbox').fill('Do things at my own pace and in my own way');
  const choice = needs.getByRole('button', { name: /^Do things at my own pace and in my own way/ });
  const before = await size(choice);
  await choice.click();
  await expect(check(choice)).toBeVisible();
  expect(await size(choice)).toEqual(before);
  expect(await choice.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const board = element.parentElement!.getBoundingClientRect();
    const mark = element.querySelector('[data-selected]')!.getBoundingClientRect();
    return element.scrollWidth <= element.clientWidth + 1 && box.left >= board.left && box.right <= board.right && mark.right <= box.right && mark.left >= box.left;
  })).toBe(true);
  await needs.getByRole('button', { name: 'Done', exact: true }).click();
});
