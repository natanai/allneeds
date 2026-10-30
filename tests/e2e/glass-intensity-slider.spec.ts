import { expect, test } from './fixtures';

test('shared intensity slider changes from solid thumb to glass during pointer interaction', async ({ page }) => {
  await page.goto('/feelings/body-cues');
  const slider = page.getByRole('slider', { name: 'Tight or constricted intensity' });
  await slider.scrollIntoViewIfNeeded();

  const area = slider.locator('..');
  const root = area.locator('..');
  const glass = area.locator('output[aria-hidden="true"]');
  await expect(root).not.toHaveAttribute('data-dragging', 'true');
  await expect(glass).toHaveCSS('opacity', '0');

  const bounds = await slider.boundingBox();
  if (!bounds) throw new Error('Intensity slider was not visible');
  const middleY = bounds.y + bounds.height / 2;
  await page.mouse.move(bounds.x + 12, middleY);
  await page.mouse.down();
  await expect(root).toHaveAttribute('data-dragging', 'true');
  await expect(glass).toHaveCSS('opacity', '1');
  await expect(glass).toHaveCSS('pointer-events', 'none');

  await page.mouse.move(bounds.x + bounds.width * .75, middleY, { steps: 5 });
  await expect.poll(() => slider.inputValue()).not.toBe('0');
  await page.mouse.up();
  await expect(root).not.toHaveAttribute('data-dragging', 'true');
  await expect(glass).toHaveCSS('opacity', '0');
});

test('the glass effect is ornamental and does not override reduced transparency', async ({ page }) => {
  await page.goto('/feelings/body-cues');
  const slider = page.getByRole('slider', { name: 'Tight or constricted intensity' });
  await slider.scrollIntoViewIfNeeded();
  await slider.dispatchEvent('pointerdown');
  const lens = slider.locator('..').locator('output[aria-hidden="true"]');
  await expect(lens).toBeVisible();
  await expect(slider).toHaveAttribute('type', 'range');
  await slider.dispatchEvent('pointerup');
});
