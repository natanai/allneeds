import { expect, test } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test('Bluesky username field avoids iOS Safari focus zoom', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-app-state', 'ready');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /Account & data/ }).click();

  const username = page.getByRole('textbox', { name: 'Bluesky username' });
  await expect(username).toBeVisible();
  await expect.poll(() => page.evaluate(() => matchMedia('(any-pointer: coarse)').matches)).toBe(true);
  await username.focus();

  const fontSize = await username.evaluate((input) => parseFloat(getComputedStyle(input).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);
});
