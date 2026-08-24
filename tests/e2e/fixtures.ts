import { expect, test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://backend.allneeds.app/api/strategies/feed**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', strategies: [] }),
      });
    });
    await use(page);
  },
});

export { expect };
