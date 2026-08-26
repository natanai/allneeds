import { expect, test } from './fixtures';

test('keeps signed-in Shared Strategies compact and contained on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const now = Date.now();
    const session = {
      did: 'did:plc:feed-owner',
      handle: 'owner.example',
      verified: true,
      admin: true,
    };
    window.sessionStorage.setItem('allneeds:bsky-session-cache-v1', JSON.stringify({
      version: 1,
      checkedAt: now,
      session,
    }));
    window.localStorage.setItem('allneeds:bsky-session-hint', 'active');
    window.localStorage.setItem('allneeds.v2.inventory', JSON.stringify({
      schemaVersion: 1,
      savedAt: new Date(now).toISOString(),
      data: {
        items: [
          {
            id: 'client-1',
            title: 'Contained strategy card',
            description: 'Saved strategy',
            need: 'Connection',
            needSlug: 'connection',
            needSlugs: ['connection'],
            tags: ['connection'],
            personal: true,
            shareWithNat: true,
            sourceNeedPage: 'connection',
            strategySlug: 'owned-contained-strategy',
            createdAt: new Date(now).toISOString(),
            visibility: 'public',
            contributor: { name: 'Nat', location: 'Missouri' },
            firstName: 'Nat',
            location: 'Missouri',
          },
        ],
      },
    }));
  });

  await page.route('https://backend.allneeds.app/api/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        signedIn: true,
        did: 'did:plc:feed-owner',
        handle: 'owner.example',
        verified: true,
        admin: true,
      }),
    });
  });
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
            clientKey: 'client-1',
            authorDid: 'did:plc:feed-owner',
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
  await expect(page.getByLabel('Public strategy')).toBeVisible();
  await expect(page.getByLabel('Needs supported by Contained strategy card')).toBeVisible();
  await expect(page.getByLabel('Edit Contained strategy card')).toBeVisible();
  await expect(page.getByLabel('Admin actions for Contained strategy card')).toBeVisible();
  await expect(page.getByLabel('Contained strategy card is saved to inventory')).toBeVisible();
  await expect(page.getByText('Needs', { exact: true })).toBeVisible();

  const geometry = await page.evaluate(() => {
    const card = document.querySelector('section[aria-label="Shared strategies"] article');
    const controls = document.querySelector('section[aria-label="Shared strategy filters"]');
    const visibility = document.querySelector('[aria-label="Public strategy"]');
    const needs = document.querySelector('[aria-label="Needs supported by Contained strategy card"]');
    const edit = document.querySelector('[aria-label="Edit Contained strategy card"]');
    const admin = document.querySelector('[aria-label="Admin actions for Contained strategy card"]');
    const saved = document.querySelector('[aria-label="Contained strategy card is saved to inventory"]');
    const cardRect = card?.getBoundingClientRect();
    const controlsRect = controls?.getBoundingClientRect();
    const utilityRects = [visibility, needs, edit, admin, saved]
      .map((element) => element?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => Boolean(rect));
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      cardLeft: cardRect?.left ?? -1,
      cardRight: cardRect?.right ?? Number.POSITIVE_INFINITY,
      controlsLeft: controlsRect?.left ?? -1,
      controlsRight: controlsRect?.right ?? Number.POSITIVE_INFINITY,
      visibilityWidth: visibility?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY,
      editWidth: edit?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY,
      savedWidth: saved?.getBoundingClientRect().width ?? Number.POSITIVE_INFINITY,
      utilityTopSpread: utilityRects.length
        ? Math.max(...utilityRects.map((rect) => rect.top)) - Math.min(...utilityRects.map((rect) => rect.top))
        : Number.POSITIVE_INFINITY,
    };
  });

  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.innerWidth);
  expect(geometry.cardLeft).toBeGreaterThanOrEqual(0);
  expect(geometry.cardRight).toBeLessThanOrEqual(geometry.innerWidth);
  expect(geometry.controlsLeft).toBeGreaterThanOrEqual(0);
  expect(geometry.controlsRight).toBeLessThanOrEqual(geometry.innerWidth);
  expect(geometry.visibilityWidth).toBeLessThanOrEqual(34);
  expect(geometry.editWidth).toBeLessThanOrEqual(42);
  expect(geometry.savedWidth).toBeLessThanOrEqual(42);
  expect(geometry.utilityTopSpread).toBeLessThanOrEqual(2);
});
