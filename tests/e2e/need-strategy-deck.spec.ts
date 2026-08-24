import { expect, test } from './fixtures';

test.describe('need strategy deck', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/needs/support');
  });

  test('supports keyboard and horizontal swipe navigation', async ({ page }) => {
    const deck = page.locator('[data-strategy-deck]');
    const activeCard = deck.locator('article[data-position="active"]');
    const activeTitle = activeCard.locator('h3');

    await expect(deck).toBeVisible();
    const firstTitle = await activeTitle.textContent();
    expect(firstTitle).toBeTruthy();

    await deck.focus();
    await page.keyboard.press('ArrowRight');
    await expect(activeTitle).not.toHaveText(firstTitle!);

    const secondTitle = await activeTitle.textContent();
    expect(secondTitle).toBeTruthy();

    const box = await activeCard.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const y = box.y + Math.min(120, box.height * 0.3);
    await page.mouse.move(box.x + box.width * 0.78, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.22, y, { steps: 6 });
    await page.mouse.up();

    await expect(activeTitle).not.toHaveText(secondTitle!);
  });

  test('uses a tall stable card surface on a mobile viewport', async ({ page }) => {
    const activeCard = page.locator('[data-strategy-deck] article[data-position="active"]');
    await expect(activeCard).toBeVisible();

    const before = await activeCard.evaluate((element) => element.getBoundingClientRect().height);
    expect(before).toBeGreaterThan(350);

    await page.evaluate(() => window.scrollBy(0, 260));
    const after = await activeCard.evaluate((element) => element.getBoundingClientRect().height);
    expect(Math.abs(after - before)).toBeLessThan(1);
  });
});
