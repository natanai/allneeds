import type { Page } from '@playwright/test';

import { expect, test, openCheckInReview } from './fixtures';

async function startCheckIn(page: Page) {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in' }).click();
}

async function skipObservation(page: Page) {
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
}

async function addTwoBodyCues(page: Page) {
  await page.getByRole('button', { name: /^Body clues/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Body clues' });
  await sheet.getByLabel('Tight or constricted intensity').fill('7');
  await sheet.getByLabel('Weighted or pressured intensity').fill('7');
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();
}

async function addFeelingShape(page: Page) {
  await page.getByRole('button', { name: /^Overall feeling/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Overall feeling' });
  const plane = sheet.getByTestId('valence-arousal-field');
  const box = await plane.boundingBox();
  if (!box) throw new Error('Overall feeling map is not visible');
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await expect(sheet.locator('output')).toHaveText('Valence −3 · Arousal +3');
  await sheet.locator('input[name="alex-shape-power"][value="0.25"]').check();
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  ))).toBe(true);
}

test('combined clues, word roles, user-selected Needs, and Journal handoff stay user-owned', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startCheckIn(page);

  await page.getByRole('textbox', { name: 'What happened?', exact: true }).fill('I felt blamed and wanted understanding when we stopped talking.');
  await expect(page.getByRole('button', { name: /Blamed.*Faux Feeling/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Understanding.*Need/ })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await addTwoBodyCues(page);
  await addFeelingShape(page);
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Continue to words' }).click();

  await page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  let sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await expect(sheet.getByText(/gives body clues and overall-feeling ratings equal weight/)).toBeVisible();
  await expect(sheet.getByText(/^Body clues$/)).toBeVisible();
  await expect(sheet.getByText(/^Overall feeling$/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Fits', exact: true }).click();
  await expect(sheet.getByRole('slider', { name: 'Anxiety intensity' })).toBeVisible();
  await sheet.getByRole('slider', { name: 'Anxiety intensity' }).fill('8');
  await sheet.getByRole('button', { name: 'Use this rating' }).click();
  await expect(sheet).toHaveCount(0);

  const search = page.getByRole('searchbox', { name: 'Search feelings and other emotion words' });
  await page.getByRole('radio', { name: 'All words' }).click();
  await search.fill('Guilt');
  await page.getByRole('button', { name: /^Guilt, Other emotion word/ }).click();
  sheet = page.getByRole('dialog', { name: 'Guilt' });
  await expect(sheet.getByText('Other emotion word')).toBeVisible();
  await expect(sheet.getByRole('link', { name: /Open Other emotion word page/ })).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Maybe', exact: true }).click();
  await expect(sheet).toHaveCount(0);

  await search.fill('Blamed');
  await page.getByRole('button', { name: /^Blamed, Faux Feeling/ }).click();
  sheet = page.getByRole('dialog', { name: 'Blamed' });
  await expect(sheet.getByText(/Faux Feelings are not compared with clues/)).toBeVisible();
  await expect(sheet.getByText(/That label does not mean the event was unreal/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Maybe', exact: true }).click();
  await expect(sheet).toHaveCount(0);

  await expect(page.getByText('My words').first()).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Selected Needs; open ways to support a Need')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add Understanding', exact: true }).click();
  await openCheckInReview(page);
  const selectedNeeds = page.getByLabel('Selected Needs; open ways to support a Need');
  await expect(selectedNeeds).toBeVisible();
  await expect(selectedNeeds.getByRole('button', { name: /Understanding, selected Need, open ways to support it/ })).toBeVisible();

  await page.getByRole('button', { name: 'Build sentence' }).click();
  const statement = page.getByLabel('Your statement');
  await expect(statement).toHaveValue(/I feel anxiety, I might feel guilt, and I might feel blamed because I need understanding/);
  await expect(statement).not.toHaveValue(/request|should/i);
  const finishedStatement = await statement.inputValue();
  await page.getByRole('button', { name: /Continue in Journal/ }).click();

  const journal = page.getByRole('dialog', { name: 'Journal' });
  await expect(journal.getByLabel('Reflection')).toHaveValue(finishedStatement);
  await expect(journal.getByRole('button', { name: 'Feeling' })).toContainText('Anxiety');
  await expect(journal.getByRole('button', { name: 'Feeling' })).not.toContainText(/Guilt|Blamed/);
  await expectNoHorizontalOverflow(page);
  await journal.getByRole('button', { name: 'Save', exact: true }).click();
  const saved = await page.evaluate(() => {
    const journal = JSON.parse(localStorage.getItem('allneeds.v2.journal') ?? 'null');
    return journal?.data?.entries?.find((entry: { tags: string[] }) => entry.tags.includes('alexithymia-check-in'));
  });
  expect(saved.notes).toBe(finishedStatement);
  expect(saved.guidedSupport.observation).toBe('I felt blamed and wanted understanding when we stopped talking.');
  expect(saved.mood).toEqual({ kind: 'rated', value: -3, arousal: 3 });
  expect(saved.source).toBe('lane');
  expect(saved.guidedSupport.bodyClues).toMatchObject([
    { intensity: 70 }, { intensity: 70 },
  ]);
  expect(saved.guidedSupport.overallRatings).toMatchObject({
    pleasantness: 0.2, energy: 0.8, power: 0.25,
  });
  expect(saved.feelings.find((item: { feeling: string }) => item.feeling === 'Anxiety')).toMatchObject({ intensity: 8 });
  expect(saved.feelings.find((item: { feeling: string }) => item.feeling === 'Anxiety').ratingSource).toBeUndefined();
  expect(saved.intensity).toBe(8);
  await expect(page.getByTestId('history-chart').getByRole('button', { name: /^Pleasantness: -3,/ })).toBeVisible();
  await expect(page.getByTestId('history-chart').getByRole('button', { name: /^Arousal: \+3,/ })).toBeVisible();
  await page.getByRole('combobox', { name: 'History measure' }).selectOption('intensity');
  await page.getByRole('combobox', { name: 'Graph feeling' }).selectOption('Anxiety');
  await expect(page.getByTestId('history-chart').getByRole('button', { name: /^Anxiety: 8,/ })).toBeVisible();
});

test('candidate decisions close immediately, while Fits offers optional intensity without a Done button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startCheckIn(page);
  await skipObservation(page);
  await page.getByRole('button', { name: 'Continue to words' }).click();
  const search = page.getByRole('searchbox', { name: 'Search feelings and other emotion words' });
  await search.fill('Anxiety');

  const open = () => page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  await open();
  let sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await expect(sheet.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Close Anxiety' }).click();
  await expect(sheet).toHaveCount(0);

  await open();
  sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await sheet.getByRole('button', { name: 'Fits', exact: true }).click();
  await expect(sheet.getByRole('slider', { name: 'Anxiety intensity' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Close Anxiety' }).click();
  await expect(sheet).toHaveCount(0);
  await open();
  sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await expect(sheet.getByRole('button', { name: 'Fits', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await sheet.getByRole('button', { name: 'Fits', exact: true }).click();
  await sheet.getByRole('button', { name: 'Leave intensity unrated' }).click();
  await expect(sheet).toHaveCount(0);

  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('allneeds.v2.alexithymia.draft');
    return raw && JSON.parse(raw).data.decisions['candidate:anxiety'];
  })).toBe('fits');
  await page.reload();
  await page.getByRole('button', { name: 'Continue previous check-in' }).click();
  await page.getByRole('radio', { name: 'All words' }).click();
  await search.fill('Anxiety');
  await open();
  sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await sheet.getByRole('button', { name: 'Fits', exact: true }).click();
  await sheet.getByRole('slider', { name: 'Anxiety intensity' }).fill('4');
  await sheet.getByRole('button', { name: 'Use this rating' }).click();
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('allneeds.v2.alexithymia.draft');
    return raw && JSON.parse(raw).data.feelingIntensities?.['candidate:anxiety'];
  })).toBe(4);

  await open();
  sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await sheet.getByRole('button', { name: 'Maybe', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('allneeds.v2.alexithymia.draft');
    const data = raw && JSON.parse(raw).data;
    return data?.decisions?.['candidate:anxiety'] === 'maybe'
      && data?.feelingIntensities?.['candidate:anxiety'] === undefined;
  })).toBe(true);

  await open();
  sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await sheet.getByRole('button', { name: 'Not this time', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('allneeds.v2.alexithymia.draft');
    return raw && JSON.parse(raw).data.decisions['candidate:anxiety'];
  })).toBe('not-this-time');
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
  { width: 320, height: 568, largeText: true },
]) {
  test(`body cues remain visible and zero removes a selection at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await startCheckIn(page);
    await skipObservation(page);
    await page.getByRole('button', { name: /^Body clues/ }).click();
    if (viewport.largeText) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const sheet = page.getByRole('dialog', { name: 'Body clues' });
    const first = sheet.getByRole('slider', { name: 'Tight or constricted intensity' });
    const second = sheet.getByRole('slider', { name: 'Weighted or pressured intensity' });
    await expect(first).toHaveValue('0');
    await expect(second).toHaveValue('0');
    await first.fill('4');
    await second.fill('8');
    await expect(sheet.getByText('2 cues selected', { exact: true })).toBeVisible();
    await sheet.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByText('Weighted or pressured · 8/10', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^Body clues/ }).click();
    await expect(second).toHaveValue('8');
    await second.fill('0');
    await expect(second).toHaveValue('0');
    await expect(sheet.getByText('1 cue selected', { exact: true })).toBeVisible();
    await sheet.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByText('Weighted or pressured · 8/10', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Tight or constricted · 4/10', { exact: true })).toBeVisible();
  });
}

test('the clue summary wraps chosen cues instead of clipping a hidden horizontal strip', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await startCheckIn(page);
  await skipObservation(page);
  await addTwoBodyCues(page);

  const tray = page.locator('section[aria-labelledby="your-clues-title"]');
  const row = tray.locator(':scope > div');
  const chips = row.locator(':scope > span');
  await expect(chips).toHaveCount(2);
  await expect(tray.getByText('Tight or constricted · 7/10', { exact: true })).toBeVisible();
  await expect(tray.getByText('Weighted or pressured · 7/10', { exact: true })).toBeVisible();

  for (const width of [1024, 1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => row.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return element.scrollWidth <= element.clientWidth + 2
        && Array.from(element.children).every((child) => {
          const chip = child.getBoundingClientRect();
          return chip.left >= bounds.left - 1 && chip.right <= bounds.right + 1;
        });
    })).toBe(true);
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole('button', { name: 'Continue to words' })).toBeVisible();
  }

  await page.setViewportSize({ width: 1024, height: 900 });
  await expect.poll(async () => {
    const first = await chips.nth(0).boundingBox();
    const second = await chips.nth(1).boundingBox();
    return Boolean(first && second && second.y > first.y + 2);
  }).toBe(true);
});

test('desktop uses a two-pane clue workspace and centered dialog without document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await startCheckIn(page);
  await skipObservation(page);

  const sourceArea = page.locator('[class*="clueSourceArea"]');
  const summary = page.locator('[class*="clueSummary"]');
  await expect.poll(async () => {
    const [sourceBox, summaryBox] = await Promise.all([sourceArea.boundingBox(), summary.boundingBox()]);
    return Boolean(sourceBox && summaryBox && summaryBox.x > sourceBox.x + sourceBox.width - 2);
  }).toBe(true);

  await page.getByRole('button', { name: /^Body clues/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Body clues' });
  await expect.poll(async () => {
    const box = await dialog.boundingBox();
    return Boolean(box && box.y > 40 && box.y + box.height < 960);
  }).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test('body-only and shape-only candidates name the channel used', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startCheckIn(page);
  await skipObservation(page);
  await addTwoBodyCues(page);
  await page.getByRole('button', { name: 'Continue to words' }).click();
  await page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  let sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await expect(sheet.getByText(/% body clue match/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Close Anxiety' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Continue without a word' }).click();
  await openCheckInReview(page);
  await page.getByRole('button', { name: /Start over/ }).click();
  await page.getByRole('button', { name: 'Start check-in' }).click();
  await skipObservation(page);
  await addFeelingShape(page);
  await page.getByRole('button', { name: 'Continue to words' }).click();
  await page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await expect(sheet.getByText(/% overall-feeling match/)).toBeVisible();
  await expect(sheet.getByText(/^Body$/)).toHaveCount(0);
});

test('No word yet builds no Feeling, Need, request, or care recommendation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startCheckIn(page);
  await skipObservation(page);
  await page.getByRole('button', { name: 'Continue to words' }).click();
  await page.getByRole('button', { name: 'Continue without a word' }).click();
  await openCheckInReview(page);
  await expect(page.getByText('I’m not sure what I feel yet.')).toBeVisible();
  await expect(page.getByLabel('Selected Needs; open ways to support a Need')).toHaveCount(0);
  await page.getByRole('button', { name: 'Build sentence' }).click();
  await expect(page.getByLabel('Your statement')).toHaveValue('I’m not sure what I feel yet.');
  await expect(page.getByText(/Try now|breathing exercise|grounding action|care recommendation/i)).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('Feeling-page support stays descriptive and routes to the present-moment check-in', async ({ page }) => {
  await page.goto('/feelings/anxiety');
  await page.getByText('How this feeling may show up').click();
  await expect(page.getByRole('heading', { name: 'Body cues' })).toBeVisible();
  await expect(page.getByText('Try now')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Start a present-moment check-in' })).toHaveAttribute('href', '/alexithymia-support');
});
