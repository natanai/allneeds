import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

async function startCheckIn(page: Page) {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in' }).click();
}

async function skipObservation(page: Page) {
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
}

async function addTwoBodyCues(page: Page) {
  await page.getByRole('button', { name: /^Body/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Body clues' });
  await sheet.getByRole('button', { name: /Tight or constricted/ }).click();
  await sheet.getByLabel('Tight or constricted intensity').fill('70');
  await sheet.getByRole('button', { name: /Weighted or pressured/ }).click();
  await sheet.getByLabel('Weighted or pressured intensity').fill('70');
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();
}

async function addFeelingShape(page: Page) {
  await page.getByRole('button', { name: /^Feeling shape/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Feeling shape' });
  await sheet.locator('input[name="alex-shape-pleasantness"][value="0"]').check();
  await sheet.locator('input[name="alex-shape-energy"][value="1"]').check();
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

  await page.getByLabel('What happened?').fill('I felt blamed and wanted understanding when we stopped talking.');
  await expect(page.getByRole('link', { name: /Blamed.*Faux Feeling/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Understanding.*Need/ })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await addTwoBodyCues(page);
  await addFeelingShape(page);
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Compare words' }).click();

  await page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  let sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await expect(sheet.getByText(/equal average of 2 channels/)).toBeVisible();
  await expect(sheet.getByText(/^Body$/)).toBeVisible();
  await expect(sheet.getByText(/^Feeling shape$/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Fits', exact: true }).click();
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();

  const search = page.getByRole('searchbox', { name: 'Search feelings and working words' });
  await search.fill('Guilt');
  await page.getByRole('button', { name: /^Guilt, Working term/ }).click();
  sheet = page.getByRole('dialog', { name: 'Guilt' });
  await expect(sheet.getByText('Working term')).toBeVisible();
  await expect(sheet.getByRole('link', { name: /Open Working term page/ })).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Maybe', exact: true }).click();
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();

  await search.fill('Blamed');
  await page.getByRole('button', { name: /^Blamed, Faux Feeling/ }).click();
  sheet = page.getByRole('dialog', { name: 'Blamed' });
  await expect(sheet.getByText(/Faux Feelings are not scored/)).toBeVisible();
  await expect(sheet.getByText(/That label does not mean the event was unreal/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Maybe', exact: true }).click();
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();

  await expect(page.getByText('My words').first()).toBeVisible();
  await page.getByRole('button', { name: 'Use these words' }).click();
  await expect(page.getByLabel("Selected Needs; open a Need's strategies")).toHaveCount(0);
  await page.getByRole('button', { name: /Understanding/ }).click();
  const selectedNeeds = page.getByLabel("Selected Needs; open a Need's strategies");
  await expect(selectedNeeds).toBeVisible();
  await expect(selectedNeeds.getByRole('link', { name: /Understanding, selected Need, open strategies/ })).toHaveAttribute('href', '/needs/understanding');

  await page.getByRole('button', { name: 'Build sentence' }).click();
  const statement = page.getByLabel('Your statement');
  await expect(statement).toHaveValue(/I feel anxiety, guilt, and blamed because I need understanding/);
  await expect(statement).not.toHaveValue(/request|should/i);
  await page.getByRole('button', { name: /Add to Journal/ }).click();

  const journal = page.getByRole('dialog', { name: 'Journal' });
  await expect(journal.getByLabel('Reflection')).toHaveValue(/guilt.*blamed.*understanding/i);
  await expect(journal.getByRole('button', { name: 'Feeling' })).toContainText('Anxiety');
  await expect(journal.getByRole('button', { name: 'Feeling' })).not.toContainText(/Guilt|Blamed/);
  await expectNoHorizontalOverflow(page);
});

test('body-only and shape-only candidates name the channel used', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startCheckIn(page);
  await skipObservation(page);
  await addTwoBodyCues(page);
  await page.getByRole('button', { name: 'Compare words' }).click();
  await page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  let sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await expect(sheet.getByText(/% body clue match/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'No word yet' }).click();
  await page.getByRole('button', { name: 'Use these words' }).click();
  await page.getByRole('button', { name: /Start over/ }).click();
  await page.getByRole('button', { name: 'Start check-in' }).click();
  await skipObservation(page);
  await addFeelingShape(page);
  await page.getByRole('button', { name: 'Compare words' }).click();
  await page.getByRole('button', { name: /^Anxiety, Feeling/ }).click();
  sheet = page.getByRole('dialog', { name: 'Anxiety' });
  await expect(sheet.getByText(/% feeling-shape match/)).toBeVisible();
  await expect(sheet.getByText(/^Body$/)).toHaveCount(0);
});

test('No word yet builds no Feeling, Need, request, or care recommendation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startCheckIn(page);
  await skipObservation(page);
  await page.getByRole('button', { name: 'Browse words without a match' }).click();
  await page.getByRole('button', { name: 'No word yet' }).click();
  await page.getByRole('button', { name: 'Use these words' }).click();
  await expect(page.getByText('I’m not sure what I feel yet.')).toBeVisible();
  await expect(page.getByLabel("Selected Needs; open a Need's strategies")).toHaveCount(0);
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
