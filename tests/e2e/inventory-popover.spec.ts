import { expect, test } from './fixtures';

const savedAt = '2026-08-24T10:00:00.000Z';

test('need rows open a floating strategy popover without stretching the grid row', async ({ page }) => {
  await page.addInitScript(({ timestamp }) => {
    window.localStorage.setItem('allneeds.v2.inventory', JSON.stringify({
      schemaVersion: 1,
      savedAt: timestamp,
      data: {
        items: [
          {
            id: 'freedom-game',
            title: 'Play a video game',
            description: 'Take a short gaming break.',
            need: 'Freedom',
            needSlug: 'freedom',
            needSlugs: ['freedom'],
            tags: ['freedom'],
            personal: true,
            sourceNeedPage: 'freedom',
            strategySlug: '',
            createdAt: timestamp,
            visibility: 'private',
          },
          {
            id: 'freedom-shake',
            title: 'Shake for 30 seconds',
            description: 'Move freely for half a minute.',
            need: 'Freedom',
            needSlug: 'freedom',
            needSlugs: ['freedom'],
            tags: ['freedom'],
            personal: true,
            sourceNeedPage: 'freedom',
            strategySlug: '',
            createdAt: timestamp,
            visibility: 'private',
          },
        ],
      },
    }));
  }, { timestamp: savedAt });

  await page.goto('/inventory');

  const freedomButton = page.getByRole('button', { name: /^Freedom, 2 saved strategies/ });
  const freedomRow = freedomButton.locator('xpath=..');
  const before = await freedomRow.boundingBox();
  expect(before).not.toBeNull();

  await freedomButton.click();
  const popover = page.getByRole('region', { name: 'Freedom strategies' });
  await expect(popover).toBeVisible();
  await expect(popover.getByRole('link', { name: /Freedom/ })).toHaveAttribute('href', '/needs/freedom');

  const after = await freedomRow.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(1);

  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);
  await expect(freedomButton).toBeFocused();

  await freedomButton.click();
  await page.getByRole('button', { name: 'Open Play a video game in Strategies' }).click();

  await expect(page.getByRole('tab', { name: /Strategies/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Showing strategies for', { exact: false })).toContainText('Freedom');
  const strategyCard = page.locator('#inventory-strategy-freedom-game');
  await expect(strategyCard).toBeVisible();
  await expect(strategyCard).toBeFocused();
  await expect(strategyCard.getByRole('heading', { level: 3, name: 'Play a video game' })).toBeVisible();
});
