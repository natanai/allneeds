import { expect, test } from './fixtures';

test('ordinary quoted wording with a postposed recipient yields evidence-backed possibilities', async ({ page }) => {
  await page.goto('/observations');
  const editor = page.getByRole('textbox', { name: 'What did you notice?' });

  await editor.fill('I got in a fight with my partner. They said “you are stupid” to me.');
  await page.getByRole('button', { name: 'Explore possible feelings and needs' }).click();

  await expect(page.getByTestId('observation-no-suggestions')).toHaveCount(0);
  await expect(page.getByTestId('observation-needs').getByRole('link', { name: 'Respect', exact: true })).toBeVisible();
  await expect(page.getByTestId('observation-feelings').locator('a').first()).toBeVisible();
  const whyThese = page.getByText('Why these?', { exact: true });
  await expect(whyThese).toBeVisible();
  await whyThese.click();
  await expect(page.getByText('The app noticed a personal evaluation directed toward you.', { exact: true })).toBeVisible();
});

test('a negative trait word about an object inside a quote stays out of the personal-evaluation family', async ({ page }) => {
  await page.goto('/observations');
  const editor = page.getByRole('textbox', { name: 'What did you notice?' });

  await editor.fill('My coworker said “the computer is stupid” to me.');
  await page.getByRole('button', { name: 'Explore possible feelings and needs' }).click();

  await expect(page.getByTestId('observation-no-suggestions')).toHaveCount(0);
  await expect(page.getByTestId('observation-needs').locator('a')).toHaveCount(4);
  await expect(page.getByTestId('observation-feelings').locator('a')).toHaveCount(4);
  const whyThese = page.getByText('Why these?', { exact: true });
  await expect(whyThese).toBeVisible();
  await whyThese.click();
  await expect(page.getByText('The app noticed a personal evaluation directed toward you.', { exact: true })).toHaveCount(0);
});
