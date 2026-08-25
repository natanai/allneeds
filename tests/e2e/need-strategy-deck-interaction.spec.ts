import { expect, test } from './fixtures';

test.describe('need strategy deck visual and gesture contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/needs/safety');
  });

  test('rear cards peek sideways at opposing angles without widening the page', async ({ page }) => {
    const deck = page.locator('[data-strategy-deck]');
    await expect(deck).toBeVisible();

    const geometry = await deck.evaluate((element) => {
      const active = element.querySelector<HTMLElement>('[data-position="active"]');
      const next = element.querySelector<HTMLElement>('[data-position="next"]');
      const previous = element.querySelector<HTMLElement>('[data-position="prev"]');
      const stack = active?.parentElement;
      if (!active || !next || !previous || !stack) return null;

      const rect = (node: Element) => {
        const bounds = node.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
      };

      return {
        active: rect(active),
        next: rect(next),
        previous: rect(previous),
        stack: rect(stack),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) return;

    expect(geometry.next.right).toBeGreaterThan(geometry.active.right + 2);
    expect(geometry.previous.left).toBeLessThan(geometry.active.left - 2);
    expect(geometry.next.top).toBeGreaterThan(geometry.active.top + 8);
    expect(geometry.previous.top).toBeGreaterThan(geometry.next.top + 8);
    expect(geometry.next.left).toBeGreaterThanOrEqual(geometry.stack.left - 1);
    expect(geometry.next.right).toBeLessThanOrEqual(geometry.stack.right + 1);
    expect(geometry.previous.left).toBeGreaterThanOrEqual(geometry.stack.left - 1);
    expect(geometry.previous.right).toBeLessThanOrEqual(geometry.stack.right + 1);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  });

  test('a modest diagonal touch swipe advances while clearly vertical intent does not', async ({ page }) => {
    const deck = page.locator('[data-strategy-deck]');
    const counter = deck.locator('[data-strategy-counter]');
    await expect(counter).toBeVisible();

    const before = await counter.textContent();
    await deck.dispatchEvent('pointerdown', {
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      button: 0,
      buttons: 1,
      clientX: 260,
      clientY: 300,
    });
    await deck.dispatchEvent('pointermove', {
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      buttons: 1,
      clientX: 242,
      clientY: 316,
    });
    await deck.dispatchEvent('pointerup', {
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      button: 0,
      buttons: 0,
      clientX: 226,
      clientY: 328,
    });

    await expect(counter).not.toHaveText(before ?? '');
    const afterHorizontal = await counter.textContent();

    await deck.dispatchEvent('pointerdown', {
      pointerId: 92,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      button: 0,
      buttons: 1,
      clientX: 240,
      clientY: 300,
    });
    await deck.dispatchEvent('pointermove', {
      pointerId: 92,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      buttons: 1,
      clientX: 252,
      clientY: 326,
    });
    await deck.dispatchEvent('pointerup', {
      pointerId: 92,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      button: 0,
      buttons: 0,
      clientX: 254,
      clientY: 346,
    });

    await expect(counter).toHaveText(afterHorizontal ?? '');
  });
});
