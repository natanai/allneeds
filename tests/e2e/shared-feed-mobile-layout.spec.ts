import { expect, test } from './fixtures';

test('keeps Shared Strategies contained to the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.unroute('https://backend.allneeds.app/api/strategies/feed**');
  await page.route('https://backend.allneeds.app/api/strategies/feed**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        strategies: [
          {
            id: 1,
            title: 'Contained strategy card',
            body: 'A long strategy body should wrap inside the feed instead of widening the mobile page.',
            visibility: 'public',
            createdAt: '2026-08-26T12:00:00.000Z',
            contributor: { name: 'Nat', location: 'Missouri' },
            needs: ['connection', 'contribution'],
          },
        ],
      }),
    });
  });

  await page.goto('/feed');
  await expect(page.getByText('Contained strategy card', { exact: true })).toBeVisible();

  const geometry = await page.evaluate(() => {
    const card = document.querySelector('section[aria-label="Shared strategies"] article');
    const controls = document.querySelector('section[aria-label="Shared strategy filters"]');
    const cardRect = card?.getBoundingClientRect();
    const controlsRect = controls?.getBoundingClientRect();
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      cardLeft: cardRect?.left ?? -1,
      cardRight: cardRect?.right ?? Number.POSITIVE_INFINITY,
      controlsLeft: controlsRect?.left ?? -1,
      controlsRight: controlsRect?.right ?? Number.POSITIVE_INFINITY,
    };
  });

  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.innerWidth);
  expect(geometry.cardLeft).toBeGreaterThanOrEqual(0);
  expect(geometry.cardRight).toBeLessThanOrEqual(geometry.innerWidth);
  expect(geometry.controlsLeft).toBeGreaterThanOrEqual(0);
  expect(geometry.controlsRight).toBeLessThanOrEqual(geometry.innerWidth);
});
