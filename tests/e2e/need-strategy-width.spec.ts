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

async function expectVisibleContainedStack(page: Page, context: string) {
  const geometry = await page.locator('[data-strategy-deck]').evaluate((deck) => {
    const active = deck.querySelector<HTMLElement>('[data-position="active"]');
    const next = deck.querySelector<HTMLElement>('[data-position="next"]');
    const previous = deck.querySelector<HTMLElement>('[data-position="prev"]');
    const stack = active?.parentElement;

    if (!active || !next || !previous || !stack) return null;

    const rect = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        left: bounds.left,
        right: bounds.right,
      };
    };

    return {
      active: rect(active),
      next: rect(next),
      previous: rect(previous),
      stack: rect(stack),
    };
  });

  expect(geometry, `${context}: three-card stack geometry should exist`).not.toBeNull();
  if (!geometry) return;

  expect(geometry.next.top, `${context}: second card should visibly sit behind the active card`).toBeGreaterThan(
    geometry.active.top + 8,
  );
  expect(geometry.previous.top, `${context}: third card should be deeper in the stack`).toBeGreaterThan(
    geometry.next.top + 8,
  );
  expect(geometry.next.bottom, `${context}: second card should peek below the active card`).toBeGreaterThan(
    geometry.active.bottom + 8,
  );
  expect(geometry.previous.bottom, `${context}: third card should peek below the second card`).toBeGreaterThan(
    geometry.next.bottom + 8,
  );

  for (const [label, card] of [['next', geometry.next], ['previous', geometry.previous]] as const) {
    expect(card.left, `${context}: ${label} card should stay inside the stack left edge`).toBeGreaterThanOrEqual(
      geometry.stack.left - 1,
    );
    expect(card.right, `${context}: ${label} card should stay inside the stack right edge`).toBeLessThanOrEqual(
      geometry.stack.right + 1,
    );
  }
}

test.describe('need strategy deck mobile containment and stack cue', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Safety stays contained and visibly stacked while every strategy card becomes active', async ({ page }) => {
    await page.goto('/needs/safety');

    const deck = page.locator('[data-strategy-deck]');
    await expect(deck).toBeVisible();
    await expectNoHorizontalOverflow(page, 'Safety initial deck');
    await expectVisibleContainedStack(page, 'Safety initial deck');

    const strategyCount = await deck.locator('article').count();
    const nextButton = page.getByRole('button', { name: 'Next strategy' });

    for (let index = 0; index < strategyCount; index += 1) {
      await nextButton.click();
      await expectNoHorizontalOverflow(page, `Safety strategy ${index + 1}`);
      await expectVisibleContainedStack(page, `Safety strategy ${index + 1}`);
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
