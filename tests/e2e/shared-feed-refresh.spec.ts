import { expect, test } from './fixtures';

test('reuses the startup strategy snapshot until Refresh is explicitly pressed', async ({ page }) => {
  let feedRequests = 0;
  await page.unroute('https://backend.allneeds.app/api/strategies/feed**');
  await page.route('https://backend.allneeds.app/api/strategies/feed**', async (route) => {
    feedRequests += 1;
    const strategies = feedRequests === 1
      ? [
          {
            id: 1,
            title: 'Newest first',
            body: 'Initial snapshot',
            visibility: 'public',
            addCount: 1,
            createdAt: '2026-08-25T12:00:00.000Z',
            contributor: { name: 'Nat', location: 'Missouri' },
            author: { handle: 'nathanael.ink', displayName: 'Account display name' },
          },
          { id: 2, title: 'Most added first', body: 'Same snapshot', visibility: 'public', addCount: 12, createdAt: '2026-08-24T12:00:00.000Z' },
        ]
      : [
          { id: 3, title: 'Explicitly refreshed strategy', body: 'New snapshot', visibility: 'public', addCount: 2, createdAt: '2026-08-25T13:00:00.000Z' },
        ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', strategies }),
    });
  });

  await page.goto('/feed');
  await expect(page.getByText('Newest first', { exact: true })).toBeVisible();
  await expect(page.getByText(/by Nat • Missouri/)).toBeVisible();
  await expect(page.getByText('@nathanael.ink', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Account display name', { exact: true })).toHaveCount(0);
  expect(feedRequests).toBe(1);

  await page.getByLabel('Sort by').selectOption('popular');
  await expect(page.locator('section[aria-label="Shared strategies"] article h3').first()).toHaveText('Most added first');
  expect(feedRequests).toBe(1);

  await page.getByRole('button', { name: 'Refresh shared strategies', exact: true }).click();
  await expect(page.getByText('Explicitly refreshed strategy', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Shared strategies refreshed at');
  expect(feedRequests).toBe(2);

  await page.reload();
  await expect(page.getByText('Explicitly refreshed strategy', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Last refreshed at');
  expect(feedRequests).toBe(2);
});
