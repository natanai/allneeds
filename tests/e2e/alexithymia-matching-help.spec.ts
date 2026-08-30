import { expect, test } from './fixtures';

test('matching help stays behind the Info disclosure before the technical methods document', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/alexithymia-support');

  await expect(page.getByText('You stay in charge')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'How matching works' })).toHaveCount(0);

  await page.getByRole('button', { name: 'About this feeling check-in' }).click();
  const about = page.getByRole('dialog', { name: 'About this check-in' });
  await expect(about).toBeVisible();

  const matchingLink = about.getByRole('link', { name: 'How matching works' });
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

test('public methods documents are readable when served as raw text', async ({ page }) => {
  for (const path of [
    '/docs/alexithymia-support-methods.md',
    '/docs/body-scan-sourcing-review.md',
  ]) {
    await page.goto(path);
    const text = await page.locator('body').innerText();

    expect(text).not.toMatch(/^#{1,6}\s/m);
    expect(text).not.toContain('```');
    expect(text).not.toMatch(/\[[^\]]+\]\([^)]+\)/);
    expect(text).not.toContain('| ---');
  }
});
