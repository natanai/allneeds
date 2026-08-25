import { expect, test } from './fixtures';

test.describe('need strategy deck visual and gesture contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/needs/safety');
  });

  test('fresh deck prioritizes a named user strategy ahead of system strategies', async ({ page }) => {
    const active = page.locator('[data-strategy-deck] [data-position="active"]');
    await expect(active.getByRole('heading', { level: 3 })).toHaveText('Comfy gaming');
    await expect(active.getByLabel('Strategy contributor')).toContainText('Autumn');
  });

  test('rear cards peek sideways at opposing angles without widening the page or stacking heavy shadows', async ({ page }) => {
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
        shadows: {
          active: getComputedStyle(active).boxShadow,
          next: getComputedStyle(next).boxShadow,
          previous: getComputedStyle(previous).boxShadow,
        },
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
    expect(geometry.shadows.active).toBe('none');
    expect(geometry.shadows.next).toBe('none');
    expect(geometry.shadows.previous).toBe('none');
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  });

  test('the active card owns touch, follows the thumb, and navigates in both directions', async ({ page }) => {
    const deck = page.locator('[data-strategy-deck]');
    const counter = deck.locator('[data-strategy-counter]');
    await expect(counter).toBeVisible();

    const before = await counter.textContent();
    let active = deck.locator('[data-position="active"]');
    await expect(active).toBeVisible();
    expect(await active.evaluate((element) => getComputedStyle(element).touchAction)).toBe('none');

    const start = await active.boundingBox();
    expect(start).not.toBeNull();
    if (!start) return;
    const startX = start.x + start.width * 0.72;
    const startY = start.y + Math.min(150, start.height * 0.35);

    await active.dispatchEvent('pointerdown', {
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      button: 0,
      buttons: 1,
      clientX: startX,
      clientY: startY,
    });
    await active.dispatchEvent('pointermove', {
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      buttons: 1,
      clientX: startX - 88,
      clientY: startY + 48,
    });

    const draggedLeft = await active.boundingBox();
    expect(draggedLeft).not.toBeNull();
    if (!draggedLeft) return;
    expect(draggedLeft.x).toBeLessThan(start.x - 58);

    const leftReveal = await deck.evaluate((element) => ({
      next: Number(getComputedStyle(element.querySelector<HTMLElement>('[data-position="next"]')!).zIndex),
      previous: Number(getComputedStyle(element.querySelector<HTMLElement>('[data-position="prev"]')!).zIndex),
    }));
    expect(leftReveal.next).toBeGreaterThan(leftReveal.previous);

    await active.dispatchEvent('pointerup', {
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      button: 0,
      buttons: 0,
      clientX: startX - 88,
      clientY: startY + 48,
    });

    await expect(counter).not.toHaveText(before ?? '');

    active = deck.locator('[data-position="active"]');
    await expect(active).toBeVisible();
    const returnStart = await active.boundingBox();
    expect(returnStart).not.toBeNull();
    if (!returnStart) return;
    const returnX = returnStart.x + returnStart.width * 0.28;
    const returnY = returnStart.y + Math.min(150, returnStart.height * 0.35);

    await active.dispatchEvent('pointerdown', {
      pointerId: 92,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      button: 0,
      buttons: 1,
      clientX: returnX,
      clientY: returnY,
    });
    await active.dispatchEvent('pointermove', {
      pointerId: 92,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      buttons: 1,
      clientX: returnX + 88,
      clientY: returnY + 44,
    });

    const draggedRight = await active.boundingBox();
    expect(draggedRight).not.toBeNull();
    if (!draggedRight) return;
    expect(draggedRight.x).toBeGreaterThan(returnStart.x + 58);

    const rightReveal = await deck.evaluate((element) => ({
      next: Number(getComputedStyle(element.querySelector<HTMLElement>('[data-position="next"]')!).zIndex),
      previous: Number(getComputedStyle(element.querySelector<HTMLElement>('[data-position="prev"]')!).zIndex),
    }));
    expect(rightReveal.previous).toBeGreaterThan(rightReveal.next);

    await active.dispatchEvent('pointerup', {
      pointerId: 92,
      pointerType: 'touch',
      isPrimary: true,
      bubbles: true,
      button: 0,
      buttons: 0,
      clientX: returnX + 88,
      clientY: returnY + 44,
    });

    await expect(counter).toHaveText(before ?? '');
  });
});
