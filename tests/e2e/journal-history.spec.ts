import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { themePresets } from '../../src/features/customizer/themePresets';

async function seed(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('history-test-seeded')) return;
    const now = new Date();
    const date = (offset: number) => { const day = new Date(now); day.setDate(day.getDate() + offset); day.setHours(12, 0, 0, 0); return day.toISOString(); };
    const base = { emotion: 'Relieved', intensity: 8, feelings: [{ feeling: 'Relieved', intensity: 8 }, { feeling: 'Anxiety', intensity: 3 }], needs: ['support'], tags: ['work'], sensations: [], strategies: [], source: 'journal' };
    const entries = [
      { ...base, id: 'today', notes: 'Today’s private reflection', dateISO: date(0), mood: { kind: 'rated', value: 3 } },
      { ...base, id: 'yesterday', notes: 'Yesterday’s page', dateISO: date(-1), mood: { kind: 'rated', value: -2 }, tags: ['home'] },
      { ...base, id: 'mixed', notes: 'Mixed is not neutral', dateISO: date(-2), mood: { kind: 'mixed' } },
      { ...base, id: 'same-a', notes: 'First exact-time page', dateISO: date(-3), mood: { kind: 'rated', value: 1 } },
      { ...base, id: 'same-b', notes: 'Second exact-time page', dateISO: date(-3), mood: { kind: 'rated', value: 1 } },
      { ...base, id: 'before', notes: 'Earlier period page', dateISO: date(-8), mood: { kind: 'rated', value: -4 } },
      { ...base, id: 'old', notes: 'An older page', dateISO: date(-40), mood: { kind: 'rated', value: 0 } },
    ];
    localStorage.setItem('allneeds.v2.journal', JSON.stringify({ schemaVersion: 1, savedAt: now.toISOString(), data: { entries } }));
    localStorage.setItem('history-test-seeded', 'yes');
  });
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px Journal and History`, () => {
    test.use({ viewport });
    test('protects a new draft while paging, editing, reloading, and saving a past page', async ({ page }) => {
      await seed(page);
      await page.goto('/inventory/journal?compose=new');
      let journal = page.getByRole('dialog', { name: 'Journal', exact: true });
      await journal.getByLabel('Reflection', { exact: true }).fill('My unfinished new page');
      await journal.getByLabel('Overall mood', { exact: true }).selectOption('mixed');
      await journal.getByRole('button', { name: 'Older', exact: false }).click();
      await expect(journal.getByText('Today’s private reflection', { exact: true })).toBeVisible();
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveCount(0);
      await journal.getByRole('button', { name: 'Edit entry', exact: true }).click();
      await journal.getByLabel('Reflection', { exact: true }).fill('A separately saved edit draft');
      await journal.getByRole('button', { name: 'New entry', exact: true }).click();
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('My unfinished new page');
      await expect(journal.getByLabel('Overall mood', { exact: true })).toHaveValue('mixed');
      await journal.getByRole('button', { name: 'Close full screen journal' }).click();
      await page.reload();
      journal = page.getByRole('dialog', { name: 'Journal', exact: true });
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('My unfinished new page');
      await journal.getByRole('button', { name: 'Older', exact: false }).click();
      await journal.getByRole('button', { name: 'Edit entry', exact: true }).click();
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('A separately saved edit draft');
      await journal.getByLabel('Overall mood', { exact: true }).selectOption('-3');
      await journal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(journal.getByText('A separately saved edit draft', { exact: true })).toBeVisible();
      await journal.getByRole('button', { name: 'New entry', exact: true }).click();
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('My unfinished new page');
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.find((entry: { id: string }) => entry.id === 'today').mood)).toEqual({ kind: 'rated', value: -3 });
      expect(await page.evaluate(() => localStorage.getItem('allneeds.v2.journal.draft.today'))).toBeNull();
      expect(await journal.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1)).toBe(true);
    });
    test('opens graph pages and resolves coincident points while preserving the focused view', async ({ page }) => {
      await seed(page); await page.goto('/inventory/journal');
      await expect(page.getByLabel('History measure')).toHaveValue('mood');
      await page.getByLabel('Period', { exact: true }).selectOption('7');
      const chart = page.getByTestId('history-chart');
      await chart.getByRole('button', { name: /^Overall mood: \+3,/ }).click();
      const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
      await expect(journal.getByText('Today’s private reflection', { exact: true })).toBeVisible();
      await journal.getByRole('button', { name: 'Close full screen journal' }).click();
      await expect(page.getByLabel('Period', { exact: true })).toHaveValue('7');
      await chart.getByRole('button', { name: /^Overall mood: \+1,/ }).last().click();
      const selected = page.getByLabel('Selected graph entries');
      await expect(selected.getByRole('button', { name: /Open journal page/ })).toHaveCount(2);
      await selected.getByRole('button', { name: /Open journal page/ }).first().click();
      await expect(journal).toBeVisible();
      await journal.getByRole('button', { name: 'Close full screen journal' }).click();
      await page.getByText('Focus & compare', { exact: true }).click();
      await page.getByLabel('Compare with the previous equal-length period').check();
      await expect(page.getByLabel('Period comparison')).toContainText('Previous');
      await page.getByLabel('History measure').selectOption('frequency');
      await page.getByLabel('Graph feeling').selectOption('Relieved');
      await page.getByLabel('Tag', { exact: true }).selectOption('work');
      await chart.getByRole('button', { name: /^Relieved: 100%/ }).first().click();
      await expect(page.getByLabel('Selected graph entries')).toBeVisible();
      await page.getByLabel('Selected graph entries').getByRole('button', { name: /Open journal page/ }).first().click();
      await journal.getByRole('button', { name: 'Close full screen journal' }).click();
      await expect(page.getByLabel('History measure')).toHaveValue('frequency');
      await expect(page.getByLabel('Tag', { exact: true })).toHaveValue('work');
      await page.reload();
      await expect(page.getByLabel('History measure')).toHaveValue('frequency');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  });
}

test('context notes and export respect the visible period and exclude reflections until opted in', async ({ page }) => {
  await seed(page); await page.goto('/inventory/journal');
  await page.getByText('Context notes', { exact: true }).click();
  await page.getByLabel('Context note', { exact: true }).fill('A session to remember');
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await expect(page.getByText(/A session to remember/, { exact: false }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Print / export' }).click();
  const sheet = page.getByRole('dialog', { name: 'Print or export history' });
  await expect(sheet.getByLabel('Include written reflections')).not.toBeChecked();
  let downloadEvent = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Download CSV' }).click();
  let download = await downloadEvent;
  const { readFile } = await import('node:fs/promises');
  let csv = await readFile((await download.path())!, 'utf8');
  expect(csv).not.toContain('Today’s private reflection'); expect(csv).not.toContain('An older page');
  await sheet.getByLabel('Include written reflections').check();
  downloadEvent = page.waitForEvent('download'); await sheet.getByRole('button', { name: 'Download CSV' }).click(); download = await downloadEvent;
  csv = await readFile((await download.path())!, 'utf8'); expect(csv).toContain('Today’s private reflection');
  await page.emulateMedia({ media: 'print' });
  await expect(sheet.getByLabel('Include written reflections')).toBeHidden();
  expect(await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundImage)).toBe('none');
  await expect(sheet.getByRole('heading', { name: 'allneeds · Emotional history' })).toBeVisible();
  await expect(sheet.getByText('Today’s private reflection', { exact: true })).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await sheet.getByRole('button', { name: 'Close Print or export history' }).click();
  await page.reload();
  await page.getByText('Context notes', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove context note: A session to remember' })).toBeVisible();
});

test('an optional mood-only page and an experienced date are saved without changing original creation time', async ({ page }) => {
  await seed(page); await page.goto('/inventory/journal?compose=new');
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await journal.getByLabel('Overall mood').selectOption('0');
  await journal.getByText('Date & reflection prompts', { exact: true }).click();
  await journal.getByLabel('When was this moment?').fill('2026-09-14T17:30');
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(journal).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.find((item: { id: string }) => !['today', 'yesterday', 'mixed', 'same-a', 'same-b', 'before', 'old'].includes(item.id)));
  expect(saved.mood).toEqual({ kind: 'rated', value: 0 });
  expect(saved.feelings).toEqual([]); expect(saved.dateISO).toBe(saved.createdAtISO);
  expect(saved.experiencedAtISO).toContain('2026-09-14');
  await page.goto(`/inventory/journal?entry=${saved.id}`);
  await expect(journal.getByText(/Originally saved/)).toBeVisible();
  await journal.getByRole('button', { name: 'New entry', exact: true }).click();
  await journal.getByLabel('Jump to a date').fill('2026-09-14');
  await expect(journal.getByLabel('Saved journal page')).toBeVisible();
  await expect(journal.getByText('No written reflection on this page.', { exact: true })).toBeVisible();
});

test('a failed device write keeps the Journal open, preserves the original collection, and exposes a recoverable draft', async ({ page }) => {
  await seed(page); await page.goto('/inventory/journal?compose=new');
  const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
  await journal.getByLabel('Reflection', { exact: true }).fill('Keep this if saving fails');
  const original = await page.evaluate(() => localStorage.getItem('allneeds.v2.journal'));
  await page.evaluate(() => {
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key === 'allneeds.v2.journal') throw new DOMException('Full', 'QuotaExceededError'); originalSet.call(this, key, value); };
  });
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(journal).toBeVisible();
  await expect(journal.getByRole('alert')).toContainText('could not be saved');
  await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('Keep this if saving fails');
  expect(await page.evaluate(() => localStorage.getItem('allneeds.v2.journal'))).toBe(original);
  await journal.getByRole('button', { name: 'Close full screen journal' }).click();
  await page.reload();
  await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('Keep this if saving fails');
});

test('History and journal inherit every preset, stay within a narrow phone, and allow keyboard reading', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 }); await seed(page);
  for (const preset of themePresets) {
    await page.goto('/inventory/journal');
    await page.evaluate((preset) => { localStorage.setItem('nvcApp.theme', JSON.stringify({ ...preset, preset: preset.name, updatedAt: Date.now() })); }, preset);
    await page.reload();
    await expect(page.getByTestId('history-chart')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const point = page.getByTestId('history-chart').getByRole('button', { name: /^Overall mood: \+3,/ });
    await point.focus(); await point.press('Enter');
    const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
    await expect(journal).toBeVisible();
    expect(await journal.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1)).toBe(true);
    await page.keyboard.press('Escape'); await expect(journal).toHaveCount(0);
  }
});
