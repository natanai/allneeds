import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { themePresets } from '../../src/features/customizer/themePresets';

async function seed(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('history-test-seeded')) return;
    const now = new Date();
    const date = (offset: number) => { const day = new Date(now); day.setDate(day.getDate() + offset); day.setHours(12, 0, 0, 0); return day.toISOString(); };
    const base = { emotion: 'Relieved', intensity: 8, feelings: [{ feeling: 'Relieved', intensity: 8 }, { feeling: 'Anxiety', intensity: 3 }], needs: ['support'], tags: ['work'], sensations: [], strategies: [], source: 'journal' };
    const entries = [
      { ...base, id: 'today', notes: 'Today’s private reflection', dateISO: date(0), mood: { kind: 'rated', value: 3, arousal: 4 } },
      { ...base, id: 'yesterday', notes: 'Yesterday’s page', dateISO: date(-1), mood: { kind: 'rated', value: -2, arousal: 2 }, tags: ['home'] },
      { ...base, id: 'mixed', notes: 'Mixed is not neutral', dateISO: date(-2), mood: { kind: 'mixed' } },
      { ...base, id: 'same-a', notes: 'First exact-time page', dateISO: date(-3), mood: { kind: 'rated', value: 1, arousal: -1 } },
      { ...base, id: 'same-b', notes: 'Second exact-time page', dateISO: date(-3), mood: { kind: 'rated', value: 1, arousal: -1 } },
      { ...base, id: 'before', notes: 'Earlier period page', dateISO: date(-8), mood: { kind: 'rated', value: -4, arousal: 5 } },
      { ...base, id: 'old', notes: 'An older page', dateISO: date(-40), mood: { kind: 'rated', value: 0, arousal: 0 } },
    ];
    localStorage.setItem('allneeds.v2.journal', JSON.stringify({ schemaVersion: 1, savedAt: now.toISOString(), data: { entries } }));
    localStorage.setItem('history-test-seeded', 'yes');
  });
}

async function placeEmotionalPoint(page: Page, plane: Locator, valence: number, arousal: number) {
  await plane.scrollIntoViewIfNeeded();
  const box = await plane.boundingBox();
  if (!box) throw new Error('Emotional map was not visible');
  const x = box.x + box.width * (valence + 5) / 10;
  const y = box.y + box.height * (5 - arousal) / 10;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 5 });
  await page.mouse.up();
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px Journal and History`, () => {
    test.use({ viewport });
    test('protects a new draft while paging, editing, reloading, and saving a past page', async ({ page }) => {
      await seed(page);
      await page.goto('/inventory/journal?compose=new');
      let journal = page.getByRole('dialog', { name: 'Journal', exact: true });
      const writingPage = journal.getByLabel('Journal writing page');
      const reflection = journal.getByLabel('Reflection', { exact: true });
      const pageTurner = journal.getByRole('navigation', { name: 'Journal pages' });
      const dialogBox = await journal.boundingBox();
      const paperBox = await writingPage.boundingBox();
      const reflectionBox = await reflection.boundingBox();
      const pageTurnerBox = await pageTurner.boundingBox();
      expect(dialogBox && paperBox && paperBox.height > dialogBox.height * .68).toBe(true);
      expect(reflectionBox && pageTurnerBox && pageTurnerBox.y > reflectionBox.y).toBe(true);
      expect(await reflection.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe('none');
      await expect(journal.getByTestId('valence-arousal-field')).toBeHidden();
      await journal.getByRole('button', { name: 'Feeling', exact: true }).click();
      const feelingSheet = page.getByRole('dialog', { name: 'Feelings', exact: true });
      await expect(feelingSheet).toBeVisible();
      await expect(feelingSheet.getByLabel('Search feelings')).not.toBeFocused();
      await feelingSheet.getByRole('button', { name: 'Close Feelings' }).click();
      await journal.getByRole('button', { name: 'Needs', exact: true }).click();
      const needSheet = page.getByRole('dialog', { name: 'Needs', exact: true });
      await expect(needSheet).toBeVisible();
      await expect(needSheet.getByLabel('Search needs')).not.toBeFocused();
      await needSheet.getByRole('button', { name: 'Done', exact: true }).click();
      await reflection.fill('My unfinished new page');
      await journal.locator('summary').filter({ hasText: 'Emotional coordinates' }).click();
      await journal.getByRole('button', { name: 'Mixed feelings', exact: true }).click();
      await journal.getByRole('button', { name: 'Turn to older journal page' }).click();
      await expect(journal.getByText('Today’s private reflection', { exact: true })).toBeVisible();
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveCount(0);
      await journal.getByRole('button', { name: 'Edit entry', exact: true }).click();
      await journal.getByLabel('Reflection', { exact: true }).fill('A separately saved edit draft');
      await journal.getByRole('button', { name: 'Turn to blank new journal page' }).click();
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('My unfinished new page');
      await journal.locator('summary').filter({ hasText: 'Emotional coordinates' }).click();
      await expect(journal.getByRole('button', { name: 'Mixed feelings', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await journal.getByRole('button', { name: 'Close full screen journal' }).click();
      await page.reload();
      journal = page.getByRole('dialog', { name: 'Journal', exact: true });
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('My unfinished new page');
      await journal.getByRole('button', { name: 'Turn to older journal page' }).click();
      await journal.getByRole('button', { name: 'Edit entry', exact: true }).click();
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('A separately saved edit draft');
      await journal.locator('summary').filter({ hasText: 'Emotional coordinates' }).click();
      await placeEmotionalPoint(page, journal.getByTestId('valence-arousal-field'), -3, 2);
      await expect(journal.locator('output')).toHaveText('Valence −3 · Arousal +2');
      await journal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(journal.getByText('A separately saved edit draft', { exact: true })).toBeVisible();
      await journal.getByRole('button', { name: 'Turn to blank new journal page' }).click();
      await expect(journal.getByLabel('Reflection', { exact: true })).toHaveValue('My unfinished new page');
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.find((entry: { id: string }) => entry.id === 'today').mood)).toEqual({ kind: 'rated', value: -3, arousal: 2 });
      expect(await page.evaluate(() => localStorage.getItem('allneeds.v2.journal.draft.today'))).toBeNull();
      expect(await journal.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1)).toBe(true);
    });
    test('opens graph pages and resolves coincident points while preserving the focused view', async ({ page }) => {
      await seed(page); await page.goto('/inventory/journal');
      await expect(page.getByLabel('History measure')).toHaveValue('mood');
      await page.getByLabel('Period', { exact: true }).selectOption('7');
      const chart = page.getByTestId('history-chart');
      const chartBox = await chart.boundingBox();
      const periodBox = await page.getByLabel('Period', { exact: true }).boundingBox();
      expect(chartBox && periodBox && chartBox.y < periodBox.y).toBe(true);
      await expect(chart).toContainText('Arousal');
      const lines = chart.getByTestId('history-series-line');
      await expect(lines).toHaveCount(2);
      await expect(lines.first()).toHaveAttribute('d', /L/);
      await chart.getByRole('button', { name: /^Arousal: \+4,/ }).click();
      await expect(page.getByRole('button', { name: 'Back to all days' })).toBeVisible();
      await expect(page.getByLabel('Entries on selected day')).toContainText('Today’s private reflection');
      await chart.getByRole('button', { name: /^Arousal: \+4,/ }).click();
      const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
      await expect(journal.getByText('Today’s private reflection', { exact: true })).toBeVisible();
      await journal.getByRole('button', { name: 'Close full screen journal' }).click();
      await expect(page.getByLabel('Period', { exact: true })).toHaveValue('custom');
      await page.getByRole('button', { name: 'Back to all days' }).click();
      await expect(page.getByLabel('Period', { exact: true })).toHaveValue('7');
      await chart.getByRole('button', { name: /^Pleasantness: \+1,/ }).last().click();
      await expect(page.getByLabel('Entries on selected day').getByRole('button', { name: /Open journal page/ })).toHaveCount(2);
      await chart.getByRole('button', { name: /^Pleasantness: \+1,/ }).last().click();
      const selected = page.getByLabel('Selected graph entries');
      await expect(selected.getByRole('button', { name: /Open journal page/ })).toHaveCount(2);
      await selected.getByRole('button', { name: /Open journal page/ }).first().click();
      await expect(journal).toBeVisible();
      await journal.getByRole('button', { name: 'Close full screen journal' }).click();
      await page.getByRole('button', { name: 'Back to all days' }).click();
      await page.getByText('Focus & compare', { exact: true }).click();
      await page.getByLabel('Compare with the previous equal-length period').check();
      await expect(page.getByLabel('Period comparison')).toContainText('Previous');
      await page.getByLabel('History measure').selectOption('frequency');
      await page.getByLabel('Graph feeling').selectOption('Relieved');
      await page.getByLabel('Tag', { exact: true }).selectOption('work');
      await chart.getByRole('button', { name: /^Relieved: 100%/ }).first().click();
      await expect(page.getByLabel('Entries on selected day')).toBeVisible();
      await page.getByLabel('Entries on selected day').getByRole('button', { name: /Open journal page/ }).first().click();
      await journal.getByRole('button', { name: 'Close full screen journal' }).click();
      await expect(page.getByLabel('History measure')).toHaveValue('frequency');
      await expect(page.getByLabel('Tag', { exact: true })).toHaveValue('work');
      await page.reload();
      await expect(page.getByLabel('History measure')).toHaveValue('frequency');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  });
}

test('daily means omit unexplained whiskers but day detail spells out genuine rating variation', async ({ page }) => {
  await seed(page); await page.goto('/inventory/journal');
  const day = await page.evaluate(() => {
    const key = 'allneeds.v2.journal';
    const stored = JSON.parse(localStorage.getItem(key)!);
    const changed = stored.data.entries.find((entry: { id: string }) => entry.id === 'same-b');
    changed.mood = { kind: 'rated', value: -3, arousal: 4 };
    localStorage.setItem(key, JSON.stringify(stored));
    const stamp = new Date(changed.dateISO);
    const two = (value: number) => String(value).padStart(2, '0');
    return `${stamp.getFullYear()}-${two(stamp.getMonth() + 1)}-${two(stamp.getDate())}`;
  });
  await page.reload();
  const chart = page.getByTestId('history-chart');
  await expect(chart.locator('[class*="rangeLine"]')).toHaveCount(0);
  await expect(chart).toContainText('Points = daily averages');
  await expect(chart.getByRole('button', { name: /Pleasantness: -1, .*Reported range -3 to [+]1 across 2 ratings/ })).toHaveCount(1);
  await chart.getByRole('button', { name: `2 journal entries on ${day}. View day` }).click();
  const ranges = page.getByLabel('Recorded rating ranges');
  await expect(ranges).toContainText('Pleasantness: -3 to +1 across 2 recorded ratings');
  await expect(ranges).toContainText('Arousal: -1 to +4 across 2 recorded ratings');
  await expect(page.getByLabel('Entries on selected day').getByRole('button', { name: /Open journal page/ })).toHaveCount(2);
  await expect(chart.locator('[class*="rangeLine"]')).toHaveCount(0);
});

test('daily badges include unrated pages and selecting a day preserves history filters on return', async ({ page }) => {
  await seed(page);
  await page.goto('/inventory/journal');
  const day = await page.evaluate(() => {
    const key = 'allneeds.v2.journal';
    const envelope = JSON.parse(localStorage.getItem(key)!);
    const today = envelope.data.entries.find((entry: { id: string }) => entry.id === 'today');
    envelope.data.entries.push({ ...today, id: 'today-unrated', notes: 'Second reflection without ratings', mood: { kind: 'unsure' } });
    localStorage.setItem(key, JSON.stringify(envelope));
    const date = new Date(today.dateISO);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  await page.reload();
  await page.getByLabel('Period', { exact: true }).selectOption('7');
  await page.getByText('Focus & compare', { exact: true }).click();
  await page.getByLabel('Tag', { exact: true }).selectOption('work');
  const chart = page.getByTestId('history-chart');
  await expect(chart.getByRole('button', { name: `2 journal entries on ${day}. View day` })).toBeVisible();
  await chart.getByRole('button', { name: `2 journal entries on ${day}. View day` }).click();
  const dayEntries = page.getByLabel('Entries on selected day');
  await expect(dayEntries.getByRole('button', { name: /Open journal page/ })).toHaveCount(2);
  await expect(dayEntries).toContainText('Second reflection without ratings');
  await expect(chart.getByRole('button', { name: /^Pleasantness: \+3,/ })).toHaveCount(1);
  await expect(page.getByLabel('Start date')).toHaveValue(day);
  await expect(page.getByLabel('End date')).toHaveValue(day);
  await page.getByRole('button', { name: 'Back to all days' }).click();
  await expect(page.getByLabel('Period', { exact: true })).toHaveValue('7');
  await expect(page.getByLabel('Tag', { exact: true })).toHaveValue('work');
  await expect(page.getByLabel('Entries on selected day')).toHaveCount(0);
});

test('mobile history displays dated entry counts and allows drag and zoom without opening pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page); await page.goto('/inventory/journal');
  const chart = page.getByTestId('history-chart');
  const dated = chart.getByText(/ · 2 entries/);
  await expect(dated).toBeVisible();
  // The count must belong to the entries' actual local date, even when the
  // date label must move left to stay inside a narrow mobile SVG.
  const realDay = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries;
    const recorded = new Date(records.find((entry: { id: string }) => entry.id === 'same-a').dateISO);
    const two = (value: number) => String(value).padStart(2, '0');
    return `${recorded.getFullYear()}-${two(recorded.getMonth() + 1)}-${two(recorded.getDate())}`;
  });
  const labelDate = await page.evaluate((day) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), realDay);
  await expect(chart.getByText(`${labelDate} · 2 entries`, { exact: true })).toBeVisible();
  const guide = chart.locator(`[data-testid="history-day-guide"][data-day="${realDay}"]`);
  await expect(guide).toHaveCount(1);
  const guideX = Number(await guide.getAttribute('data-anchor-x'));
  const markX = Number(await chart.getByRole('button', { name: /^Pleasantness: \+1,/ }).first().getAttribute('x')) + 22;
  expect(guideX).toBeCloseTo(markX, 1);
  const badge = chart.getByRole('button', { name: /2 journal entries on .* View day/ });
  await expect(badge).toBeVisible();
  await badge.click();
  await expect(page.getByLabel('Entries on selected day').getByRole('button', { name: /Open journal page/ })).toHaveCount(2);
  await page.getByRole('button', { name: 'Back to all days' }).click();
  const plot = chart.locator('svg');
  await expect(plot).toHaveCSS('touch-action', 'pan-y');
  // Safari's native page-pinch must only be cancelled within the chart.
  // A one-finger vertical swipe must remain available to scroll the page.
  const nativeGestures = await plot.evaluate((svg) => {
    const dispatch = (target: EventTarget, type: string, fingers?: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      if (fingers !== undefined) Object.defineProperty(event, 'touches', { value: { length: fingers } });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    return {
      pinchStart: dispatch(svg, 'gesturestart'),
      pinchMove: dispatch(svg, 'gesturechange'),
      twoFingers: dispatch(svg, 'touchmove', 2),
      oneFinger: dispatch(svg, 'touchmove', 1),
      outsideGraph: dispatch(document.body, 'gesturestart'),
    };
  });
  expect(nativeGestures).toEqual({ pinchStart: true, pinchMove: true, twoFingers: true, oneFinger: false, outsideGraph: false });
  const box = await plot.boundingBox();
  if (!box) throw new Error('History plot is missing');
  await page.mouse.move(box.x + box.width * .55, box.y + box.height * .55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .28, box.y + box.height * .55, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByLabel('Period', { exact: true })).toHaveValue('exploring');
  await expect(page.getByRole('dialog', { name: 'Journal', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByRole('button', { name: 'Reset zoom' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset zoom' }).click();
  await expect(page.getByLabel('Period', { exact: true })).toHaveValue('30');
  await expect(chart.getByText(/ · 2 entries/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('backdated journal experiences keep their plotted day while showing the original saved date', async ({ page }) => {
  await seed(page); await page.goto('/inventory/journal');
  const day = await page.evaluate(() => {
    const key = 'allneeds.v2.journal';
    const envelope = JSON.parse(localStorage.getItem(key)!);
    const today = envelope.data.entries.find((entry: { id: string }) => entry.id === 'today');
    const experience = new Date(today.dateISO);
    experience.setDate(experience.getDate() - 3);
    envelope.data.entries.push({ ...today, id: 'backdated-save', notes: 'Recorded later about an earlier moment', experiencedAtISO: experience.toISOString(), createdAtISO: today.dateISO });
    localStorage.setItem(key, JSON.stringify(envelope));
    const two = (value: number) => String(value).padStart(2, '0');
    return `${experience.getFullYear()}-${two(experience.getMonth() + 1)}-${two(experience.getDate())}`;
  });
  await page.reload();
  await page.getByTestId('history-chart').getByRole('button', { name: `3 journal entries on ${day}. View day` }).click();
  const dayList = page.getByLabel('Entries on selected day');
  await expect(dayList).toContainText('Recorded later about an earlier moment');
  await expect(dayList).toContainText('Plotted by experienced date · originally saved');
  await expect(dayList.getByRole('button', { name: /Open journal page/ })).toHaveCount(3);
});

test('desktop trackpad-style zoom changes the history window without scaling its mood axis', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await seed(page); await page.goto('/inventory/journal');
  const chart = page.getByTestId('history-chart');
  const plot = chart.locator('svg');
  const box = await plot.boundingBox();
  if (!box) throw new Error('History plot is missing');
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .5);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -200);
  await page.keyboard.up('Control');
  await expect(page.getByLabel('Period', { exact: true })).toHaveValue('exploring');
  await expect(chart).toContainText('−5 to +5');
  await expect(page.getByRole('button', { name: 'Reset zoom' })).toBeVisible();
});

test('supplementary Journal History cards keep native fields inside their mobile bounds', async ({ page }) => {
  await seed(page);
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/inventory/journal');
    const context = page.locator('details').filter({ has: page.getByText('Context notes', { exact: true }) });
    await context.locator('summary').click();
    await expect(context).toHaveAttribute('open', '');
    await expect(context.locator('ul')).toHaveCount(0); // An empty note list must not reserve blank space.
    const date = context.locator('input[type="date"]');
    const note = context.getByLabel('Context note', { exact: true });
    const addNote = context.getByRole('button', { name: 'Add note' });
    for (const control of [date, note, addNote]) {
      const bounds = await control.boundingBox(), card = await context.boundingBox();
      expect(bounds && card).toBeTruthy();
      expect(bounds!.x).toBeGreaterThanOrEqual(card!.x + 8);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(card!.x + card!.width - 8);
    }
    expect(await date.evaluate((element) => getComputedStyle(element).boxSizing)).toBe('border-box');
    await page.getByText('Focus & compare', { exact: true }).click();
    const search = page.getByLabel('Search journal');
    const filter = page.getByRole('form', { name: 'Filter journal history' });
    const filterBounds = await filter.boundingBox(), searchBounds = await search.boundingBox();
    expect(filterBounds && searchBounds).toBeTruthy();
    expect(searchBounds!.x + searchBounds!.width).toBeLessThanOrEqual(filterBounds!.x + filterBounds!.width + 1);
    const preference = page.locator('details').filter({ has: page.getByText('New entry preference', { exact: true }) });
    await expect(preference).toHaveCSS('background-color', await context.evaluate((element) => getComputedStyle(element).backgroundColor));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

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
  await journal.locator('summary').filter({ hasText: 'Emotional coordinates' }).click();
  const plane = journal.getByTestId('valence-arousal-field');
  await placeEmotionalPoint(page, plane, -4, 4);
  const firstColor = await plane.getByRole('button', { name: /Emotional point/ }).evaluate((element) => getComputedStyle(element).backgroundColor);
  await placeEmotionalPoint(page, plane, 4, -4);
  const secondColor = await plane.getByRole('button', { name: /Emotional point/ }).evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(secondColor).not.toBe(firstColor);
  await placeEmotionalPoint(page, plane, 0, 0);
  await expect(journal.locator('output')).toHaveText('Valence 0 · Arousal 0');
  await journal.getByText('Date & reflection prompts', { exact: true }).click();
  await journal.getByLabel('When was this moment?').fill('2026-09-14T17:30');
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(journal).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('allneeds.v2.journal')!).data.entries.find((item: { id: string }) => !['today', 'yesterday', 'mixed', 'same-a', 'same-b', 'before', 'old'].includes(item.id)));
  expect(saved.mood).toEqual({ kind: 'rated', value: 0, arousal: 0 });
  expect(saved.feelings).toEqual([]); expect(saved.dateISO).toBe(saved.createdAtISO);
  expect(saved.experiencedAtISO).toContain('2026-09-14');
  await page.goto(`/inventory/journal?entry=${saved.id}`);
  await expect(journal.getByText(/Originally saved/)).toBeVisible();
  await expect(journal.getByText('No written reflection on this page.', { exact: true })).toBeVisible();
  while (await journal.getByRole('button', { name: /Turn to (newer|blank new) journal page/ }).count()) {
    await journal.getByRole('button', { name: /Turn to (newer|blank new) journal page/ }).click();
  }
  await expect(journal.getByLabel('Journal writing page')).toBeVisible();
  await expect(journal.getByRole('button', { name: /Turn to (newer|blank new) journal page/ })).toHaveCount(0);
  await journal.getByRole('button', { name: 'Turn to older journal page' }).click();
  await expect(journal.getByLabel('Saved journal page')).toBeVisible();
  await expect(journal.getByText('Today’s private reflection', { exact: true })).toBeVisible();
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
  test.setTimeout(themePresets.length * 10_000);
  await page.setViewportSize({ width: 320, height: 720 }); await seed(page);
  for (const preset of themePresets) {
    await page.goto('/inventory/journal');
    await page.evaluate((preset) => { localStorage.setItem('nvcApp.theme', JSON.stringify({ ...preset, preset: preset.name, updatedAt: Date.now() })); }, preset);
    await page.reload();
    // A previous iteration intentionally saved a one-day view. Begin each
    // preset check at the overview before testing the same drill-down sequence.
    await page.getByLabel('Period', { exact: true }).selectOption('30');
    await expect(page.getByTestId('history-chart')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const point = page.getByTestId('history-chart').getByRole('button', { name: /^Pleasantness: \+3,/ });
    await point.focus(); await point.press('Enter');
    const dayEntries = page.getByLabel('Entries on selected day');
    await expect(dayEntries).toBeVisible();
    await dayEntries.getByRole('button', { name: /Valence \+3/ }).click();
    const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
    await expect(journal).toBeVisible();
    expect(await journal.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1)).toBe(true);
    await page.keyboard.press('Escape'); await expect(journal).toHaveCount(0);
  }
});
