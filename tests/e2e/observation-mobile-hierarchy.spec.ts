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
