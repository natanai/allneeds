import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

async function visualRules(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.border,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      minHeight: style.minHeight,
      padding: style.padding,
    };
  });
}

async function toolbarRules(page: Page) {
  const search = page.getByRole('searchbox');
  const shuffle = page.getByRole('button', { name: 'Shuffle magnets' });
  return {
    search: await visualRules(search),
    shuffle: await visualRules(shuffle),
  };
}

test('catalogue pages use one responsive search and shuffle language', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const snapshots = [];
  for (const route of ['/feelings', '/needs', '/faux-feelings']) {
    await page.goto(route);
    await expect(page.getByRole('searchbox')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Shuffle magnets' })).toHaveCount(1);
    snapshots.push(await toolbarRules(page));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(snapshots[1]).toEqual(snapshots[0]);
  expect(snapshots[2]).toEqual(snapshots[0]);

  await page.getByRole('searchbox', { name: 'Search faux feelings' }).fill('ignored');
  await expect(page.getByRole('status')).toContainText('No faux feelings match');
});

test('strategy composers share visual rules and retain their save behavior', async ({ page }) => {
  await page.goto('/inventory');
  await page.getByText('Add a personal strategy', { exact: true }).click();
  const inventoryForm = page.locator('#inventory-form');
  const inventoryRules = await visualRules(inventoryForm);
  await inventoryForm.getByLabel('Strategy name').fill('UI consolidation walk');
  await inventoryForm.getByLabel('How do you put it into practice?').fill('Take a short walk and check in afterward.');
  await inventoryForm.getByRole('button', { name: 'Needs', exact: true }).click();
  const picker = inventoryForm.getByRole('dialog', { name: 'Choose one or more needs' });
  await picker.getByRole('option', { name: 'Peace', exact: true }).click();
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await inventoryForm.getByRole('button', { name: 'Save to device', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'UI consolidation walk' })).toBeVisible();

  await page.goto('/needs/love-caring');
  const needForm = page.locator('#suggestion-form');
  expect(await visualRules(needForm)).toEqual(inventoryRules);
  await needForm.getByLabel('Strategy name').fill('UI consolidation message');
  await needForm.getByLabel('How do you put it into practice?').fill('Send one specific appreciation.');
  await needForm.getByRole('button', { name: 'Save to device', exact: true }).click();
  await expect(needForm.getByLabel('Strategy name')).toHaveValue('');
  await expect(page.getByRole('status')).toContainText('Saved “UI consolidation message”');
});
