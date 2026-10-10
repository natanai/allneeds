import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

async function openWordStep(page: Page) {
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Browse all feelings' }).click();
}

async function expectWordControlsInsideMainPane(page: Page) {
  const filters = page.getByRole('radiogroup', { name: 'Word view' });
  const sidebar = page.locator('aside[aria-label="Your word choices"]');

  await expect(filters).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Matches' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'All feelings' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'My words' })).toBeVisible();

  await expect.poll(async () => {
    const [filterBox, sidebarBox] = await Promise.all([
      filters.boundingBox(),
      sidebar.boundingBox(),
    ]);
    if (!filterBox || !sidebarBox) return false;
    return filterBox.x + filterBox.width <= sidebarBox.x + 1;
  }).toBe(true);
}

test('desktop word filters never run underneath the Your words sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openWordStep(page);
  await expectWordControlsInsideMainPane(page);

  await page.setViewportSize({ width: 1024, height: 900 });
  await expectWordControlsInsideMainPane(page);
});
