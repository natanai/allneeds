import { expect, test as base, type Page } from '@playwright/test';

const reviewedSharedStrategies = [
  { id: 37, title: 'Read a character driven novel', body: 'Read a story whose characters feel meaningful.', needIds: ['connection'], visibility: 'public', contributor: { name: 'Nat', location: 'Missouri' } },
  { id: 36, title: 'Play a social video game', body: 'Play with other people or spend time with familiar characters.', needIds: ['connection'], visibility: 'public', contributor: { name: 'Nat', location: 'Missouri' } },
  { id: 16, title: 'Call a parent', body: 'Call a parent you trust and let yourself hear their care.', needIds: ['support'], visibility: 'public', contributor: { name: 'Nat', location: 'Missouri' } },
  { id: 10, title: 'Call a friend', body: 'Trust us, they want to hear from you <3', needIds: ['connection', 'support'], visibility: 'public', contributor: { name: 'Nat', location: 'Missouri' } },
];

export async function routeReviewedSharedStrategies(page: Page) {
  await page.unroute('https://backend.allneeds.app/api/strategies/feed**');
  await page.route('https://backend.allneeds.app/api/strategies/feed**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok', strategies: reviewedSharedStrategies }),
  }));
}

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
