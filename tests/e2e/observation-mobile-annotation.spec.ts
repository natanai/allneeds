import { expect, test } from './fixtures';

test('mobile explains an underlined guidance word when the caret lands at its end boundary', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observations');

  const editor = page.getByRole('textbox', { name: 'What did you notice?' });
  const observation = 'My partner is confusing and sometimes just won’t talk to me.';
  await editor.fill(observation);

  await expect(page.getByText('Underlined text has notes — tap it for details.')).toBeVisible();

  await editor.evaluate((element) => {
    const textNode = element.firstChild;
    if (!textNode) throw new Error('The editor has no text node.');
    const text = element.textContent ?? '';
    const offset = text.indexOf('sometimes') + 'sometimes'.length;
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(textNode, offset);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  });

  const explanation = page.getByRole('complementary', { name: 'About “sometimes”' });
  await expect(explanation).toBeVisible();
  await expect(explanation).toContainText('An amount that could be more specific');
  await expect(explanation).toContainText('add a count, duration, or timeframe');
});
