import { expect, test } from './fixtures';

test('matching help stays in-app before the technical methods document', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/alexithymia-support');

  const matchingLink = page.getByRole('link', { name: 'How matching works' }).first();
  await expect(matchingLink).toBeVisible();

  const routeBefore = page.url();
  await matchingLink.click();
  await expect(page).toHaveURL(routeBefore);

  const sheet = page.getByRole('dialog', { name: 'How matching works' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('A percentage is similarity, not certainty')).toBeVisible();
  await expect(sheet.getByText(/does not mean there is an 86% chance/i)).toBeVisible();
  await expect(sheet.getByText(/event text you type is not scored/i)).toBeVisible();

  const technical = sheet.getByRole('link', { name: /Full technical methods & sources/i });
  await expect(technical).toHaveAttribute('href', /docs\/alexithymia-support-methods\.md$/);
  await expect(technical).toHaveAttribute('target', '_blank');
});
