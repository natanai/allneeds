import { expect, test } from './fixtures';

test('mobile exposes every active annotation in a notes ledger while preserving tap-to-explain', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observations');

  const editor = page.getByRole('textbox', { name: 'What did you notice?' });
  const observation = 'My partner is confusing and sometimes just won’t talk to me.';
  await editor.fill(observation);

  const notesButton = page.getByRole('button', { name: /^Notes/ });
  await expect(notesButton).toBeVisible();
  await notesButton.click();

  const ledger = page.getByRole('complementary', { name: 'Observation text notes' });
  await expect(ledger).toBeVisible();
  await expect(ledger).toContainText('“sometimes”');
  await expect(ledger).toContainText('An amount that could be more specific');
  await expect(ledger).toContainText('add a count, duration, or timeframe');

  await page.getByRole('button', { name: 'Close text notes' }).click();
  await expect(ledger).toHaveCount(0);

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
