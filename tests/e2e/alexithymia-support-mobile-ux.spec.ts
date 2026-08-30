import { expect, test } from './fixtures';

test('mobile check-in opens as a focused workspace without forcing the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in' }).click();

  const checkIn = page.locator('article[aria-label^="Feeling word support:"]');
  const textarea = page.getByLabel('What happened?');
  await expect(checkIn).toBeVisible();
  await expect(textarea).toBeVisible();

  expect(await textarea.evaluate((element) => document.activeElement === element)).toBe(false);

  const initialGeometry = await page.evaluate(() => {
    const workspace = document.querySelector('article[aria-label^="Feeling word support:"]');
    const rect = workspace?.getBoundingClientRect();
    return {
      position: workspace ? getComputedStyle(workspace).position : '',
      top: rect?.top ?? Number.POSITIVE_INFINITY,
      left: rect?.left ?? Number.POSITIVE_INFINITY,
      right: rect?.right ?? Number.NEGATIVE_INFINITY,
      height: rect?.height ?? 0,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(initialGeometry.position).toBe('fixed');
  expect(initialGeometry.top).toBeLessThanOrEqual(1);
  expect(initialGeometry.left).toBeGreaterThanOrEqual(0);
  expect(initialGeometry.right).toBeLessThanOrEqual(initialGeometry.innerWidth + 1);
  expect(initialGeometry.height).toBeGreaterThanOrEqual(initialGeometry.innerHeight - 1);
  expect(initialGeometry.scrollWidth).toBeLessThanOrEqual(initialGeometry.innerWidth + 1);

  await textarea.focus();
  await expect(page.getByRole('heading', { name: 'What are you trying to put into words?' })).toBeHidden();

  const focusedGeometry = await page.evaluate(() => {
    const continueButton = [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Continue');
    const textareaElement = document.querySelector('textarea[placeholder^="For example"]');
    const actionRect = continueButton?.parentElement?.getBoundingClientRect();
    const textareaRect = textareaElement?.getBoundingClientRect();
    return {
      actionTop: actionRect?.top ?? Number.POSITIVE_INFINITY,
      actionBottom: actionRect?.bottom ?? Number.POSITIVE_INFINITY,
      textareaTop: textareaRect?.top ?? Number.POSITIVE_INFINITY,
    };
  });

  expect(focusedGeometry.actionTop).toBeLessThan(130);
  expect(focusedGeometry.actionBottom).toBeLessThan(focusedGeometry.textareaTop + 4);
});

test('mobile clue choices stay compact peers and contained', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/alexithymia-support');
  await page.getByRole('button', { name: 'Start check-in' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();

  const body = page.getByRole('button', { name: /^Body clues/ });
  const shape = page.getByRole('button', { name: /^Overall feeling/ });
  await expect(body).toBeVisible();
  await expect(shape).toBeVisible();

  const geometry = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')]
      .filter((button) => /^(Body clues|Overall feeling)/.test(button.textContent?.trim() ?? ''));
    const rects = buttons.slice(0, 2).map((button) => button.getBoundingClientRect());
    return {
      heights: rects.map((rect) => rect.height),
      lefts: rects.map((rect) => rect.left),
      rights: rects.map((rect) => rect.right),
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(geometry.heights).toHaveLength(2);
  expect(Math.abs(geometry.heights[0]! - geometry.heights[1]!)).toBeLessThanOrEqual(2);
  expect(Math.min(...geometry.heights)).toBeGreaterThanOrEqual(60);
  expect(Math.min(...geometry.lefts)).toBeGreaterThanOrEqual(0);
  expect(Math.max(...geometry.rights)).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth + 1);
});
