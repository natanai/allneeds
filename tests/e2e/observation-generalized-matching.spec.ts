import { expect, test } from './fixtures';

test('ordinary quoted wording with a postposed recipient yields evidence-backed possibilities', async ({ page }) => {
  await page.goto('/observations');
  const editor = page.getByRole('textbox', { name: 'What did you notice?' });

  await editor.fill('I got in a fight with my partner. They said “you are stupid” to me.');
  await page.getByRole('button', { name: 'Explore possible feelings and needs' }).click();

  await expect(page.getByTestId('observation-no-suggestions')).toHaveCount(0);
  await expect(page.getByTestId('observation-needs').getByRole('link', { name: 'Respect', exact: true })).toBeVisible();
  await expect(page.getByTestId('observation-feelings').locator('a').first()).toBeVisible();
  await expect(page.getByText('Why these?', { exact: true })).toBeVisible();
  await expect(page.getByText('The app noticed a personal evaluation directed toward you.', { exact: true })).toBeVisible();
});

test('a negative trait word about an object inside a quote does not become a personal-evaluation match', async ({ page }) => {
  await page.goto('/observations');
  const editor = page.getByRole('textbox', { name: 'What did you notice?' });

  await editor.fill('My coworker said “the computer is stupid” to me.');
  await page.getByRole('button', { name: 'Explore possible feelings and needs' }).click();

  await expect(page.getByTestId('observation-no-suggestions')).toBeVisible();
  await expect(page.getByTestId('observation-needs')).toHaveCount(0);
  await expect(page.getByTestId('observation-feelings')).toHaveCount(0);
});
