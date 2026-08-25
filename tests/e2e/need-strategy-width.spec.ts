import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function expectNoHorizontalOverflow(page: Page, context: string) {
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(widths.scrollWidth, `${context}: page should not exceed the mobile viewport`).toBeLessThanOrEqual(
    widths.viewportWidth + 1,
  );
}

test.describe('need strategy deck mobile width containment', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Safety stays contained while every strategy card becomes active', async ({ page }) => {
    await page.goto('/needs/safety');

    const deck = page.locator('[data-strategy-deck]');
    await expect(deck).toBeVisible();
    await expectNoHorizontalOverflow(page, 'Safety initial deck');

    const strategyCount = await deck.locator('article').count();
    const nextButton = page.getByRole('button', { name: 'Next strategy' });

    for (let index = 0; index < strategyCount; index += 1) {
      await nextButton.click();
      await expectNoHorizontalOverflow(page, `Safety strategy ${index + 1}`);
    }

    await page.getByRole('button', { name: 'View all' }).click();
    await expectNoHorizontalOverflow(page, 'Safety View all');
  });

  test('every Need route preserves the mobile width invariant', async ({ page }) => {
    await page.goto('/needs');

    const needRoutes = await page.locator('a[href^="/needs/"]').evaluateAll((links) => (
      [...new Set(
        links
          .map((link) => (link as HTMLAnchorElement).getAttribute('href'))
          .filter((href): href is string => Boolean(href)),
      )]
    ));

    expect(needRoutes.length).toBeGreaterThan(0);
    expect(needRoutes).toContain('/needs/safety');

    for (const route of needRoutes) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page, `${route} initial`);

      const deck = page.locator('[data-strategy-deck]');
      if (await deck.count()) {
        await deck.focus();
        await page.keyboard.press('ArrowRight');
        await expectNoHorizontalOverflow(page, `${route} after card navigation`);

        const viewAll = page.getByRole('button', { name: 'View all' });
        if (await viewAll.count()) {
          await viewAll.click();
          await expectNoHorizontalOverflow(page, `${route} View all`);
        }
      }
    }
  });
});
