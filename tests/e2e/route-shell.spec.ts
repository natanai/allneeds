import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

type RouteExpectation = {
  path: string;
  label: string;
  title?: string;
  requiresHeading?: boolean;
  navVisible?: boolean;
};

const publicRoutes: RouteExpectation[] = [
  { path: '/', label: 'Home', title: 'allneeds.app' },
  { path: '/feelings', label: 'Feelings' },
  { path: '/feelings/hurt', label: 'Feeling: Hurt' },
  { path: '/feelings/body-cues', label: 'Body cues', requiresHeading: false },
  { path: '/feelings/emotions-wheel', label: 'Emotions wheel', navVisible: false },
  { path: '/needs', label: 'Needs' },
  { path: '/needs/love-caring', label: 'Need for love/caring' },
  { path: '/faux-feelings', label: 'Faux feelings' },
  { path: '/faux-feelings/abandoned', label: 'Faux feeling: Abandoned' },
  { path: '/observations', label: 'Observations' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/inventory/journal', label: 'Journal history' },
  { path: '/feed', label: 'Shared strategies' },
  { path: '/alexithymia-support', label: 'Feeling word support' },
  { path: '/not-a-real-route', label: 'Page not found' },
];

function collectRuntimeProblems(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  return problems;
}

for (const reference of [
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
] as const) {
  test.describe(`${reference.name} routed shell`, () => {
    test.use({ viewport: reference.viewport });

    test('every public route has a stable, non-overflowing app shell', async ({ page }) => {
      const runtimeProblems = collectRuntimeProblems(page);

      for (const route of publicRoutes) {
        await page.goto(route.path);
        await expect(page.locator('html')).toHaveAttribute('data-app-state', 'ready');
        const navBoard = page.getByLabel('Primary navigation magnets');
        const main = page.locator('main');
        if (route.navVisible === false) {
          await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
        } else {
          await expect(navBoard).toHaveAttribute('data-ready', 'true');
        }
        await expect(main).toHaveCount(1);
        await expect(main).toHaveAttribute('aria-label', route.label);
        if (route.requiresHeading !== false) {
          await expect(main.getByRole('heading', { level: 1 }).first()).toBeVisible();
        }
        await expect(page).toHaveTitle(route.title ?? `${route.label} • allneeds.app`);
        await expect(page.getByText('Loading page…', { exact: true })).toHaveCount(0);

        expect(await page.evaluate(() => {
          const nav = document.querySelector('nav[aria-label="Primary"]');
          const mainRegion = document.querySelector('main');
          return Boolean(nav && mainRegion
            && (nav.compareDocumentPosition(mainRegion) & Node.DOCUMENT_POSITION_FOLLOWING));
        })).toBe(true);
        expect(await page.evaluate(() => (
          document.documentElement.scrollWidth <= window.innerWidth + 1
        ))).toBe(true);
      }

      expect(runtimeProblems).toEqual([]);
    });
  });
}

test('the nav remains the same shell surface but scrolls away with the document', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/needs/love-caring');
  const primaryNav = page.getByRole('navigation', { name: 'Primary' });
  const navBoard = page.getByLabel('Primary navigation magnets');
  await expect(navBoard).toHaveAttribute('data-ready', 'true');
  expect(await primaryNav.evaluate((nav) => getComputedStyle(nav).position)).toBe('static');
  await primaryNav.evaluate((nav) => { nav.dataset.shellInstance = 'persistent'; });

  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'auto' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
  const scrolledNavBox = await primaryNav.boundingBox();
  expect(scrolledNavBox).not.toBeNull();
  expect(scrolledNavBox!.y).toBeLessThan(0);

  await navBoard.getByRole('link', { name: 'Observations', exact: true }).click();
  await expect(page).toHaveURL(/\/observations$/);
  await expect(primaryNav).toHaveAttribute('data-shell-instance', 'persistent');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  expect(runtimeProblems).toEqual([]);
});

test('filtered browse state and exact scroll position survive Back and Forward', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/feelings');
  const search = page.getByPlaceholder('Search feelings');
  const board = page.getByLabel('Feelings magnet board');
  await search.fill('a');
  await expect(search).toHaveValue('a');
  await expect(board).toHaveAttribute('data-ready', 'true');
  const filteredCount = await board.locator('[data-magnet-id]').count();
  expect(filteredCount).toBeGreaterThan(4);

  const destination = board.locator('[data-magnet-id]').last();
  const href = await destination.getAttribute('href');
  expect(href).toMatch(/^\/feelings\//);
  await destination.scrollIntoViewIfNeeded();
  const browseScroll = await page.evaluate(() => window.scrollY);
  expect(browseScroll).toBeGreaterThan(100);
  await destination.click();
  await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);

  await page.goBack();
  await expect(page).toHaveURL(/\/feelings$/);
  await expect(search).toHaveValue('a');
  await expect(board).toHaveAttribute('data-ready', 'true');
  await expect(board.locator('[data-magnet-id]')).toHaveCount(filteredCount);
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - browseScroll))
    .toBeLessThanOrEqual(2);

  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  expect(runtimeProblems).toEqual([]);
});
