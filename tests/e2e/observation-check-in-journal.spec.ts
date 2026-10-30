import type { Page } from '@playwright/test';
import { expect, test, openCheckInReview } from './fixtures';

const checkInKey = 'allneeds.v2.alexithymia.draft';
const journalKey = 'allneeds.v2.journal.draft';
const preferenceKey = 'allneeds.v2.journal.entry-start';
const observation = 'I felt anxiety after waiting for support.';
async function readDraft(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.data, checkInKey);
}
async function writeObservation(page: Page, text = observation) {
  await page.goto('/observations');
  await page.getByRole('textbox', { name: 'What did you notice?' }).fill(text);
}
async function seedCheckIn(page: Page) {
  await page.goto('/');
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ schemaVersion: 2, savedAt: new Date().toISOString(), data: {
    checkInId: 'existing-check-in', updatedAt: new Date().toISOString(), stage: 4,
    observation: 'My earlier observation.', openRegion: 'chest', selectedCues: { 'chest-tight': 65 },
    bodyClear: false, shape: { energy: .25 }, decisions: { 'candidate:fear': 'maybe' },
    termOrder: ['candidate:fear'], customTerms: ['😶'], noWordYet: false,
    selectedNeeds: ['support'], statement: 'I want these exact words.', statementEdited: true,
  } })), checkInKey);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test.describe(`${viewport.width}px guided Journal entry`, () => {
    test.use({ viewport });
    test('carries Observation possibilities through body clues, reload, choices, and one Journal save', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await writeObservation(page);
      await page.getByRole('button', { name: 'Explore possible feelings and needs' }).click();
      if (viewport.width > 720) await page.getByRole('radio', { name: 'Met', exact: true }).click();
      const feelingLabels = await page.getByTestId('observation-feelings').locator('a').allTextContents();
      await page.getByRole('button', { name: 'Continue with check-in', exact: true }).click();
      await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue(observation);
      let draft = await readDraft(page);
      const origin = draft.observationSuggestions;
      expect(origin.termIds.length).toBeGreaterThanOrEqual(feelingLabels.length);
      expect(draft.decisions).toEqual({});
      expect(draft.selectedNeeds).toEqual([]);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('button', { name: /^Body clues/ }).click();
      const body = page.getByRole('dialog', { name: 'Body clues', exact: true });
      await body.getByRole('combobox', { name: 'Body area', exact: true }).selectOption('overall');
      await body.getByRole('slider', { name: 'Muted or numb intensity' }).fill('5');
      await body.getByRole('button', { name: 'Done', exact: true }).click();
      await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
      await expect(page.getByRole('button', { name: /^Anxiety, Feeling.*From your observation/ })).toBeVisible();
      draft = await readDraft(page);
      expect(draft.observationSuggestions).toEqual(origin);
      await page.reload();
      await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
      for (const label of feelingLabels) await expect(page.getByRole('button', { name: new RegExp(`^${label}, Feeling`) })).toBeVisible();
      await page.getByRole('button', { name: /^Anxiety, Feeling.*From your observation/ }).click();
      await page.getByRole('dialog', { name: 'Anxiety', exact: true }).getByRole('button', { name: 'Maybe', exact: true }).click();
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      const suggestedNeeds = page.getByLabel('Needs from your observation', { exact: true });
      await suggestedNeeds.getByRole('button', { name: 'Add Support', exact: true }).click();
      await openCheckInReview(page);
      await page.getByRole('button', { name: 'Build sentence', exact: true }).click();
      await expect(page.getByRole('textbox', { name: 'Your statement', exact: true })).toHaveValue(/I might feel anxiety/);
      await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
      const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
      await expect(journal.getByRole('textbox', { name: 'Reflection', exact: true })).toHaveValue(/I might feel anxiety/);
      await journal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(journal).toHaveCount(0);
      const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries);
      expect(entries).toHaveLength(1);
      expect(entries[0].needs).toEqual(['support']);
      expect(entries[0].feelings).toEqual([{ feeling: 'Anxiety', intensity: 5, ratingSource: 'unknown' }]);
      expect(entries[0].guidedSupport.terms).toEqual([{ label: 'Anxiety', role: 'feeling', decision: 'maybe' }]);
      expect(entries[0].guidedSupport.bodyClues).toHaveLength(1);
      expect(await readDraft(page)).toBeUndefined();
      await page.getByLabel('Primary navigation magnets').getByRole('link', { name: 'Observations', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Continue with check-in', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Use in this check-in', exact: true })).toHaveCount(0);
      expect(errors).toEqual([]);
    });

    test('new entry offers guided and direct writing; an explicit preference survives and can change', async ({ page }) => {
      await page.goto('/inventory/journal');
      await page.getByRole('button', { name: 'New entry', exact: true }).click();
      const choice = page.getByRole('dialog', { name: 'New entry', exact: true });
      await expect(choice.getByRole('button', { name: 'Close New entry', exact: true })).toBeFocused();
      await expect(choice.getByRole('button', { name: 'Write directly in Journal', exact: true })).toBeVisible();
      const box = await choice.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      await choice.getByRole('checkbox').check();
      await choice.getByRole('button', { name: /^Guided check-in/ }).click();
      await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toBeVisible();
      expect(await page.evaluate((key) => localStorage.getItem(key), preferenceKey)).toBe('check-in');
      await page.goto('/inventory/journal');
      await expect(page.getByRole('button', { name: 'Write directly', exact: true })).toBeVisible();
      await page.evaluate((key) => localStorage.removeItem(key), checkInKey);
      await page.reload();
      await page.getByRole('button', { name: 'New entry', exact: true }).click();
      await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toBeVisible();
      await expect(choice).toHaveCount(0);
      await page.goto('/inventory/journal');
      await page.getByText('New entry preference', { exact: true }).click();
      await page.getByLabel('Start new entries with', { exact: true }).selectOption('writing');
      await page.getByRole('button', { name: 'New entry', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Journal', exact: true }).getByLabel('Reflection', { exact: true })).toBeEmpty();
      expect(await page.evaluate((key) => localStorage.getItem(key), preferenceKey)).toBe('writing');
    });
  });
}

test('can continue without Explore, skip optional clues, and save without endorsing suggestions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await writeObservation(page);
  await page.getByRole('button', { name: 'Continue with check-in', exact: true }).click();
  const revised = `${observation} I took a break.`;
  await page.getByRole('textbox', { name: 'What happened?', exact: true }).fill(revised);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Anxiety, Feeling.*From your earlier observation/ })).toBeVisible();
  await page.getByRole('button', { name: 'Continue without a word', exact: true }).click();
  await openCheckInReview(page);
  await page.getByRole('button', { name: 'Continue in Journal', exact: true }).click();
  await page.getByRole('dialog', { name: 'Journal', exact: true }).getByRole('button', { name: 'Save', exact: true }).click();
  const entry = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries[0]);
  expect(entry.notes).toBe(revised);
  expect(entry.needs).toEqual([]);
  expect(entry.feelings).toEqual([]);
  expect(entry.mood).toBeUndefined();
});

test('entry choice fits a narrow phone with enlarged text and Escape restores its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/inventory/journal');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const trigger = page.getByRole('button', { name: 'New entry', exact: true });
  await trigger.focus(); await trigger.press('Enter');
  const choice = page.getByRole('dialog', { name: 'New entry', exact: true });
  await expect(choice.getByRole('button', { name: 'Close New entry', exact: true })).toBeFocused();
  expect(await choice.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await choice.getByRole('button', { name: 'Write directly in Journal', exact: true }).scrollIntoViewIfNeeded();
  await expect(choice.getByRole('button', { name: 'Write directly in Journal', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(choice).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate((key) => localStorage.getItem(key), preferenceKey)).toBeNull();
  await writeObservation(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.getByRole('button', { name: 'Continue with check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  const word = page.getByRole('button', { name: /^Anxiety, Feeling.*From your observation/ });
  await word.scrollIntoViewIfNeeded();
  const box = await word.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(321);
});

test('a guide visit applies text to the same check-in while keeping clues, choices, and personal wording', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedCheckIn(page);
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Get help describing what happened' }).click();
  await page.getByRole('link', { name: 'Observations guide', exact: true }).click();
  await page.getByRole('textbox', { name: 'What did you notice?' }).fill('They closed the laptop.');
  await page.getByRole('button', { name: 'Use in this check-in', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue('They closed the laptop.');
  const draft = await readDraft(page);
  expect(draft).toMatchObject({ checkInId: 'existing-check-in', selectedCues: { 'chest-tight': 65 }, decisions: { 'candidate:fear': 'maybe' }, selectedNeeds: ['support'], customTerms: ['😶'], statement: 'I want these exact words.', statementEdited: true });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to words', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await openCheckInReview(page);
  await expect(page.getByRole('textbox', { name: 'Your statement', exact: true })).toHaveValue('I want these exact words.');
});

test('an unrelated unfinished check-in survives cancellation and is replaced only by the explicit action', async ({ page }) => {
  await seedCheckIn(page);
  await writeObservation(page);
  await page.getByRole('button', { name: 'Continue with check-in', exact: true }).click();
  const conflict = page.getByRole('dialog', { name: 'Unfinished check-in', exact: true });
  expect((await readDraft(page)).observation).toBe('My earlier observation.');
  await conflict.getByRole('button', { name: 'Close Unfinished check-in' }).click();
  await page.getByRole('button', { name: 'Continue with check-in', exact: true }).click();
  await conflict.getByRole('button', { name: 'Replace with new check-in', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toHaveValue(observation);
  expect((await readDraft(page)).checkInId).not.toBe('existing-check-in');
});

test('direct writing from a guide visit retains chosen context and completes the same check-in', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedCheckIn(page);
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Get help describing what happened' }).click();
  await page.getByRole('link', { name: 'Observations guide', exact: true }).click();
  await page.getByRole('textbox', { name: 'What did you notice?' }).fill(observation);
  await page.getByRole('button', { name: 'Write directly in Journal', exact: true }).click();
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('I want these exact words.');
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/inventory\/journal$/);
  expect(await readDraft(page)).toBeUndefined();
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries);
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({ needs: ['support'], feelings: [{ feeling: 'Fear', intensity: 5, ratingSource: 'unknown' }], guidedSupport: { checkInId: 'existing-check-in', observation } });
});

test('a stale guide cannot apply over a newer check-in created in another tab', async ({ page }) => {
  await seedCheckIn(page);
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Get help describing what happened' }).click();
  await page.getByRole('link', { name: 'Observations guide', exact: true }).click();
  await page.getByRole('textbox', { name: 'What did you notice?' }).fill(observation);
  await page.evaluate((key) => {
    const stored = JSON.parse(localStorage.getItem(key)!);
    stored.data.checkInId = 'newer-check-in'; stored.data.observation = 'A different new moment.';
    localStorage.setItem(key, JSON.stringify(stored));
  }, checkInKey);
  await page.getByRole('button', { name: 'Use in this check-in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('another tab');
  await expect(page).toHaveURL(/observations$/);
  expect((await readDraft(page)).observation).toBe('A different new moment.');
});

test('a legacy check-in without an ID is protected as an unrelated unfinished draft', async ({ page }) => {
  await seedCheckIn(page);
  await page.evaluate((key) => {
    const stored = JSON.parse(localStorage.getItem(key)!); delete stored.data.checkInId;
    localStorage.setItem(key, JSON.stringify(stored));
  }, checkInKey);
  await writeObservation(page);
  await page.getByRole('button', { name: 'Continue with check-in', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Unfinished check-in', exact: true })).toBeVisible();
  expect((await readDraft(page)).observation).toBe('My earlier observation.');
  await page.getByRole('button', { name: 'Continue saved check-in', exact: true }).click();
  await openCheckInReview(page);
  await expect(page.getByRole('textbox', { name: 'Your statement', exact: true })).toHaveValue('I want these exact words.');
  await expect(page.getByRole('button', { name: 'Continue previous check-in', exact: true })).toHaveCount(0);
});

test('a stale replacement cannot overwrite a check-in changed while the choice was open', async ({ page }) => {
  await seedCheckIn(page);
  await writeObservation(page);
  await page.getByRole('button', { name: 'Continue with check-in', exact: true }).click();
  await page.evaluate((key) => {
    const stored = JSON.parse(localStorage.getItem(key)!); stored.data.observation = 'Work from another tab.';
    localStorage.setItem(key, JSON.stringify(stored));
  }, checkInKey);
  const conflict = page.getByRole('dialog', { name: 'Unfinished check-in', exact: true });
  await conflict.getByRole('button', { name: 'Replace with new check-in', exact: true }).click();
  await expect(conflict.getByRole('alert')).toContainText('another tab');
  expect((await readDraft(page)).observation).toBe('Work from another tab.');
  await expect(page).toHaveURL(/observations$/);
});

test('direct writing keeps an occupied Journal draft and the source observation intact', async ({ page }) => {
  await page.goto('/inventory/journal?compose=new');
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await journal.getByLabel('Reflection', { exact: true }).fill('My unfinished writing.');
  await writeObservation(page);
  await page.getByRole('button', { name: 'Write directly in Journal', exact: true }).click();
  const conflict = page.getByRole('dialog', { name: 'Unfinished Journal entry', exact: true });
  await expect(conflict).toBeVisible();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).data.notes, journalKey)).toBe('My unfinished writing.');
  await conflict.getByRole('button', { name: 'Open unfinished Journal', exact: true }).click();
  await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('My unfinished writing.');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.observation.draft')!).data.text)).toBe(observation);
});

for (const destination of ['check-in', 'journal'] as const) {
  test(`${destination} handoff stays on Observations when saving the destination fails`, async ({ page }) => {
    await writeObservation(page);
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) { if (name === key) throw new DOMException('Storage full', 'QuotaExceededError'); original.call(this, name, value); };
    }, destination === 'check-in' ? checkInKey : journalKey);
    await page.getByRole('button', { name: destination === 'check-in' ? 'Continue with check-in' : 'Write directly in Journal', exact: true }).click();
    await expect(page).toHaveURL(/observations$/);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'What did you notice?' })).toHaveText(observation);
  });
}

test('the optional Journal magnet and menu use the same doorway and remembered preference', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.getByLabel('Primary navigation magnets');
  await nav.getByRole('button', { name: 'Customizer', exact: true }).click();
  const customizer = page.getByRole('dialog', { name: 'Customizer', exact: true });
  await customizer.getByText('Journal', { exact: true }).click();
  await expect(customizer.getByRole('switch', { name: 'Journal', exact: true })).toBeChecked();
  await customizer.getByRole('button', { name: 'Close customizer', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'Journal', exact: true })).toHaveAttribute('href', '/inventory/journal?start=new');
  await nav.getByRole('link', { name: 'Journal', exact: true }).click();
  let choice = page.getByRole('dialog', { name: 'New entry', exact: true });
  await expect(choice).toBeVisible();
  await choice.getByRole('button', { name: 'Write directly in Journal', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Journal', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await nav.getByRole('link', { name: 'Journal', exact: true }).click();
  await expect(choice).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(choice).toHaveCount(0);
  await expect(page).toHaveURL(/\/inventory\/journal$/);
  await page.getByRole('button', { name: 'New entry', exact: true }).click();
  choice = page.getByRole('dialog', { name: 'New entry', exact: true });
  await choice.getByRole('checkbox').check();
  await choice.getByRole('button', { name: /^Guided check-in/ }).click();
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toBeVisible();
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), checkInKey);
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'allneeds.app menu', exact: true }).getByRole('button', { name: 'New journal entry' }).click();
  await expect(page.getByRole('textbox', { name: 'What happened?', exact: true })).toBeVisible();
  await expect(choice).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});
