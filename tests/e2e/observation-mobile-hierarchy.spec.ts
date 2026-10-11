import { expect, test } from './fixtures';

test('mobile keeps observation actions compact and results ahead of secondary controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observations');

  const editor = page.getByRole('textbox', { name: 'What did you notice?' });
  await editor.fill('We agreed to meet at 7 and then they canceled.');

  const explore = page.getByRole('button', { name: 'Explore possible feelings and needs' });
  const clear = page.getByRole('button', { name: 'Clear observation' });
  await expect(explore).toHaveText('Explore');
  await expect(clear).toHaveText('Clear');

  const exploreBox = await explore.boundingBox();
  const clearBox = await clear.boundingBox();
  expect(exploreBox).not.toBeNull();
  expect(clearBox).not.toBeNull();
  expect(clearBox!.width).toBeLessThan(exploreBox!.width);

  await explore.click();

  const resultsHeading = page.getByRole('heading', { name: 'Feelings and Needs to explore' });
  await expect(resultsHeading).toHaveText('Feelings & Needs');
  await expect(page.getByText('How does this situation relate to your Needs?', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/A Need can matter whether it is met or unmet/i)).toHaveCount(0);

  const firstNeed = page.getByTestId('observation-needs').locator('a').first();
  const firstFeeling = page.getByTestId('observation-feelings').locator('a').first();
  const needState = page.getByRole('radiogroup', { name: 'Need status' });
  await expect(firstNeed).toBeVisible();
  await expect(firstFeeling).toBeVisible();
  await expect(needState).toBeVisible();

  const needBox = await firstNeed.boundingBox();
  const feelingBox = await firstFeeling.boundingBox();
  const modeBox = await needState.boundingBox();
  expect(needBox).not.toBeNull();
  expect(feelingBox).not.toBeNull();
  expect(modeBox).not.toBeNull();
  expect(needBox!.y).toBeLessThan(modeBox!.y);
  expect(feelingBox!.y).toBeLessThan(modeBox!.y);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('Quick Check shows per-detail guidance without a duplicate recipe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observations');

  await expect(page.getByText('Observation recipe', { exact: true })).toHaveCount(0);
  const slots = page.getByRole('list', { name: 'Observation slots' });
  const guidance = [
    { label: 'When?', detail: 'Yesterday at 3 p.m.' },
    { label: 'Where or with whom?', detail: 'In the conference room with Alex' },
    { label: 'What did you see or hear?', detail: 'They closed the laptop.' },
    { label: 'Number or exact words', detail: 'They called three times.' },
  ];

  for (const { label, detail } of guidance) {
    await slots.getByRole('button', { name: `About ${label}` }).click();
    const dialog = page.getByRole('dialog', { name: label });
    await expect(dialog).toContainText(detail);
    await page.getByRole('button', { name: `Close ${label}` }).click();
    await expect(dialog).toHaveCount(0);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('observation guide citations open the source shown in the numbered library', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observations');
  await page.locator('#observation-guide > summary').click();
  await page.getByText('What counts as an observation', { exact: true }).click();

  const citation = page.locator('#observation-guide a[href="#observation-guide-ref-9"]').first();
  await expect(citation).toHaveText('[1]');
  await citation.click();

  const reference = page.locator('#observation-guide-ref-9');
  await expect(reference).toBeVisible();
  await expect(reference).toContainText('[1] Behavioral observation reliability guidance');
});
