import { customTermId } from '../../src/features/alexithymia/customWordIdentity';
import { expect, test } from './fixtures';

const customWord = 'A feeling I am still finding words for';
const draftKey = 'allneeds.v2.alexithymia.draft';
const layoutKey = 'magnetPositions:alexithymia-selected-words';

test('recap magnets preserve roles and choices through dragging, previews, physics changes, and reload', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const original = {
    checkInId: 'recap-magnets', stage: 5, observation: '', openRegion: null,
    selectedCues: {}, bodyClear: false, shape: {}, noWordYet: false,
    termOrder: ['candidate:anxiety', 'candidate:calm', 'candidate:gratitude', 'faux:blamed', customTermId(customWord)],
    decisions: { 'candidate:anxiety': 'fits', 'candidate:calm': 'maybe', 'candidate:gratitude': 'fits', 'faux:blamed': 'maybe', [customTermId(customWord)]: 'fits' },
    feelingIntensities: { 'candidate:anxiety': 4 }, customTerms: [customWord],
    selectedNeeds: ['empowerment', 'space'], statement: 'I want to keep these exact words.', statementEdited: true,
  };
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify({ schemaVersion: 3, savedAt: new Date().toISOString(), data })), { key: draftKey, data: original });
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  const board = page.getByLabel('Selected feeling words; show descriptions', { exact: true });
  const needs = page.getByLabel('Selected Needs; open ways to support a Need', { exact: true });
  await expect(board).toHaveAttribute('data-ready', 'true');
  await expect(board.getByRole('switch')).toBeChecked();
  const anxiety = board.getByRole('button', { name: 'Anxiety, Feeling, Fits · Intensity 4/10, show description', exact: true });
  await expect(anxiety).toHaveAttribute('data-magnet-id', 'alex-selected-word-candidate:anxiety');
  await expect(anxiety).not.toHaveAttribute('aria-pressed');
  await expect(board.getByRole('button', { name: 'Calm, Feeling, Maybe, show description', exact: true })).toBeVisible();
  await expect(board.getByRole('button', { name: 'Gratitude, Other emotion word, Fits, show description', exact: true })).toBeVisible();
  await expect(board.getByRole('button', { name: 'Blamed, Faux Feeling, Maybe, show description', exact: true })).toBeVisible();
  await expect(board.getByRole('button', { name: `${customWord}, Your word, Fits, show description`, exact: true })).toBeVisible();

  await anxiety.scrollIntoViewIfNeeded();
  const before = await anxiety.evaluate(element => ({ x: parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-x')), y: parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-y')) }));
  const box = (await anxiety.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 32, box.y + box.height / 2 + 24, { steps: 5 });
  const during = await anxiety.evaluate(element => ({ x: parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-x')), y: parseFloat((element as HTMLElement).style.getPropertyValue('--magnet-y')) }));
  expect(during.x - before.x).toBeGreaterThan(20);
  expect(during.y - before.y).toBeGreaterThan(12);
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  for (const label of ['Calm', 'Gratitude', 'Blamed', customWord]) {
    const trigger = board.getByRole('button', { name: new RegExp(`^${label},`) });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const preview = page.getByRole('dialog', { name: label, exact: true });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Fits', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
    await expect(trigger).toBeFocused();
  }
  await board.getByRole('switch').focus();
  await page.keyboard.press('Space');
  await expect(board.getByRole('switch')).not.toBeChecked();
  await expect(needs.getByRole('switch')).toBeChecked();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).meta.playActive, layoutKey)).toBe(false);
  await page.reload();
  await page.getByRole('button', { name: 'Continue previous check-in', exact: true }).click();
  await expect(board.getByRole('switch')).not.toBeChecked();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, draftKey);
  for (const key of ['termOrder', 'decisions', 'feelingIntensities', 'selectedNeeds', 'statement'] as const) expect(saved[key]).toEqual(original[key]);
  await anxiety.focus();
  await page.keyboard.press('Enter');
  const preview = page.getByRole('dialog', { name: 'Anxiety', exact: true });
  await preview.getByRole('link', { name: 'Open full Feeling page', exact: true }).click();
  await expect(page).toHaveURL(/\/feelings\/anxiety$/);
  await page.getByRole('link', { name: 'Return to check-in', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
  await expect(page.getByRole('textbox', { name: 'Your statement', exact: true })).toHaveValue(original.statement);
  await expect(anxiety).toBeVisible();
});
