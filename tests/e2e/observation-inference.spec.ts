import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

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

async function highlightedText(page: Page, name: string) {
  return page.evaluate((highlightName) => {
    const registry = CSS.highlights;
    const highlight = registry?.get(highlightName);
    return highlight ? [...highlight].map((range) => range.toString()) : [];
  }, name);
}

test('the shared local analysis powers highlights, Quick Check, and evidence-backed live suggestions', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  const retiredAssetRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/data\/(?:observation-guide\.json|observation_cues\.csv|observation_cue_modules\.json)$/.test(new URL(request.url()).pathname)) {
      retiredAssetRequests.push(request.url());
    }
  });

  await page.goto('/observations');
  const editor = page.getByRole('textbox', { name: 'What did you notice?' });
  await expect(editor).toHaveAttribute('contenteditable', 'true');
  await expect(page.locator('[data-observation-editor="single-surface"] textarea')).toHaveCount(0);

  const observation = 'Tuesday at 3 p.m. in the kitchen, I heard “Please wait” twice. I feel anxious, I need rest, and I felt ignored.';
  await editor.fill(observation);
  await expect(editor).toHaveText(observation);
  await expect(editor).toHaveAttribute('data-annotation-count', /[1-9]\d*/);

  const slots = page.getByRole('list', { name: 'Observation slots' }).getByRole('listitem');
  await expect(slots).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) await expect(slots.nth(index)).toHaveAttribute('data-complete', 'true');

  await expect(page.locator('a[href="/feelings/anxious"]')).toHaveCount(1);
  await expect(page.locator('a[href="/needs/rest"]')).toHaveCount(1);
  await expect(page.locator('a[href="/faux-feelings/ignored"]')).toHaveCount(1);
  await expect.poll(() => highlightedText(page, 'observation-feeling')).toContain('anxious');
  await expect.poll(() => highlightedText(page, 'observation-need')).toContain('rest');
  await expect.poll(() => highlightedText(page, 'observation-faux-feeling')).toContain('ignored');
  expect((await highlightedText(page, 'observation-formula')).length).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Explore possible feelings and needs' }).click();
  const needs = page.getByTestId('observation-needs').locator('a');
  const feelings = page.getByTestId('observation-feelings').locator('a');
  await expect(needs.first()).toHaveAttribute('href', '/needs/rest');
  await expect(feelings.first()).toHaveAttribute('href', '/feelings/anxious');
  expect(await needs.count()).toBeGreaterThan(0);
  expect(await needs.count()).toBeLessThanOrEqual(4);
  expect(await feelings.count()).toBeGreaterThan(0);
  expect(await feelings.count()).toBeLessThanOrEqual(4);
  await expect(page.getByRole('radio', { name: 'Unmet', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Met', exact: true })).toBeVisible();
  await expect(page.getByText(/something feels missing|something feels supported/i)).toHaveCount(0);
  await expect(page.getByText('Why these?', { exact: true })).toBeVisible();

  await editor.fill('🙂 banana telescope purple');
  await expect(page.getByRole('heading', { name: 'Not enough information yet' })).toBeVisible();
  await expect(page.getByTestId('observation-needs')).toHaveCount(0);
  await expect(page.getByTestId('observation-feelings')).toHaveCount(0);
  await expect(page.getByText('Why these?', { exact: true })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Met', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Not enough information yet' })).toBeVisible();

  await page.getByRole('radio', { name: 'Unmet', exact: true }).click();
  await editor.fill('I feel calm.');
  await expect(page.getByTestId('observation-feelings').locator('a[href="/feelings/calm"]')).toBeVisible();
  await expect(page.getByText(/\b(?:probability|confidence)\b/i)).toHaveCount(0);
  await expect(page.getByText(/\b(?:exact|nearby) match\b/i)).toHaveCount(0);

  expect(retiredAssetRequests).toEqual([]);
  expect(runtimeProblems).toEqual([]);
});

test('plain-text editing, line breaks, explanations, and highlight ranges stay on one surface', async ({ page }) => {
  const runtimeProblems = collectRuntimeProblems(page);
  await page.goto('/observations');
  const editor = page.getByRole('textbox', { name: 'What did you notice?' });

  await editor.fill('I feel anxious.');
  await editor.press('End');
  await editor.press('Enter');
  await editor.type('I need rest.');
  await expect.poll(() => editor.textContent()).toBe('I feel anxious.\nI need rest.');

  await editor.evaluate((element) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', '\nI felt ignored.');
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: clipboard }));
  });
  await expect.poll(() => editor.textContent()).toBe('I feel anxious.\nI need rest.\nI felt ignored.');
  await expect(page.getByRole('link', { name: 'Open Anxious' })).toHaveCount(0);
  await expect(editor.locator('*')).toHaveCount(0);

  await editor.press('ControlOrMeta+z');
  await expect.poll(() => editor.textContent()).toBe('I feel anxious.\nI need rest.');
  await editor.press('ControlOrMeta+Shift+z');
  await expect.poll(() => editor.textContent()).toBe('I feel anxious.\nI need rest.\nI felt ignored.');

  await editor.evaluate((element) => {
    const text = element.firstChild;
    if (!text) throw new Error('The editor has no text node.');
    const offset = (element.textContent ?? '').indexOf('anxious') + 2;
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(text, offset);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  });
  await expect(page.getByRole('link', { name: 'Open Anxious' })).toBeVisible();

  const beforeLayoutChange = await highlightedText(page, 'observation-feeling');
  await page.setViewportSize({ width: 390, height: 844 });
  await editor.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await page.evaluate(() => { document.body.style.zoom = '1.15'; });
  expect(await highlightedText(page, 'observation-feeling')).toEqual(beforeLayoutChange);
  await expect(editor.locator('*')).toHaveCount(0);

  expect(runtimeProblems).toEqual([]);
});

test('unclassified and identity wording do not trigger fabricated results', async ({ page }) => {
  await page.goto('/observations');
  const editor = page.getByRole('textbox', { name: 'What did you notice?' });

  await editor.fill('Guilt');
  await editor.press('End');
  await expect(page.getByText('Your wording', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/preserved as your wording|catalog match/i)).toHaveCount(0);
  await expect(page.locator('[aria-label^="About “Guilt”"]')).toHaveCount(0);
  await expect.poll(() => highlightedText(page, 'observation-surface-term')).toEqual([]);

  await page.getByRole('button', { name: 'Explore possible feelings and needs' }).click();
  await expect(page.getByRole('heading', { name: 'Not enough information yet' })).toBeVisible();

  await editor.fill('I am autistic.');
  await expect.poll(() => highlightedText(page, 'observation-guidance')).not.toContain('autistic');
  await expect(page.getByRole('heading', { name: 'Not enough information yet' })).toBeVisible();
});

test('desktop uses a task-and-context workspace and mobile returns to one linear column', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/observations');
  const work = page.getByTestId('observation-workspace-main');
  const rail = page.getByRole('complementary', { name: 'Observation writing support' });
  const desktopWork = await work.boundingBox();
  const desktopRail = await rail.boundingBox();
  expect(desktopWork).not.toBeNull();
  expect(desktopRail).not.toBeNull();
  expect(desktopRail!.x).toBeGreaterThan(desktopWork!.x + desktopWork!.width - 8);
  expect(Math.abs(desktopRail!.y - desktopWork!.y)).toBeLessThan(8);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileWork = await work.boundingBox();
  const mobileRail = await rail.boundingBox();
  expect(mobileWork).not.toBeNull();
  expect(mobileRail).not.toBeNull();
  expect(mobileRail!.y).toBeGreaterThan(mobileWork!.y + mobileWork!.height - 8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('plain-language guide citations reveal their matching source', async ({ page }) => {
  await page.goto('/observations');
  await page.getByText('Observation guide', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Describe what happened with concrete details' })).toBeVisible();

  await page.getByRole('link', { name: '[2]' }).first().click();
  await expect(page.getByRole('link', { name: '[2] Concreteness and comprehension' })).toBeVisible();
});
