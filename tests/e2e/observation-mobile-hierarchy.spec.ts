import { expect, test } from './fixtures';
import observationGuide from '../../src/data/observationGuide.json' with { type: 'json' };

test('mobile keeps observation actions compact and results ahead of secondary controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observations');

  const editor = page.getByRole('textbox', { name: 'What did you notice?' });
  await editor.fill('We agreed to meet at 7 and then they canceled.');

  const explore = page.getByRole('button', { name: 'Explore possible feelings and needs' });
  const clear = page.getByRole('button', { name: 'Clear observation' });
  await expect(explore).toHaveText('Explore');
  await expect(clear).toHaveText('Clear');

  const exploreBox = await explore.boundingBox();
  const clearBox = await clear.boundingBox();
  expect(exploreBox).not.toBeNull();
  expect(clearBox).not.toBeNull();
  expect(clearBox!.width).toBeLessThan(exploreBox!.width);

  await explore.click();

  const resultsHeading = page.getByRole('heading', { name: 'Feelings and Needs to explore' });
  await expect(resultsHeading).toHaveText('Feelings & Needs');
  await expect(page.getByText('How does this situation relate to your Needs?', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/A Need can matter whether it is met or unmet/i)).toHaveCount(0);

  const firstNeed = page.getByTestId('observation-needs').locator('a').first();
  const firstFeeling = page.getByTestId('observation-feelings').locator('a').first();
  const needState = page.getByRole('radiogroup', { name: 'Need status' });
  await expect(firstNeed).toBeVisible();
  await expect(firstFeeling).toBeVisible();
  await expect(needState).toBeVisible();

  const needBox = await firstNeed.boundingBox();
  const feelingBox = await firstFeeling.boundingBox();
  const modeBox = await needState.boundingBox();
  expect(needBox).not.toBeNull();
  expect(feelingBox).not.toBeNull();
  expect(modeBox).not.toBeNull();
  expect(needBox!.y).toBeLessThan(modeBox!.y);
  expect(feelingBox!.y).toBeLessThan(modeBox!.y);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('Quick Check shows per-detail guidance without a duplicate recipe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observations');

  await expect(page.getByText('Observation recipe', { exact: true })).toHaveCount(0);
  const slots = page.getByRole('list', { name: 'Observation slots' });
  const guidance = [
    { label: 'When?', detail: 'Yesterday at 3 p.m.' },
    { label: 'Where or with whom?', detail: 'In the conference room with Alex' },
    { label: 'What did you see or hear?', detail: 'They closed the laptop.' },
    { label: 'Number or exact words', detail: 'They called three times.' },
  ];

  for (const { label, detail } of guidance) {
    await slots.getByRole('button', { name: `About ${label}` }).click();
    const dialog = page.getByRole('dialog', { name: label });
    await expect(dialog).toContainText(detail);
    await page.getByRole('button', { name: `Close ${label}` }).click();
    await expect(dialog).toHaveCount(0);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('the full research index and source library are available on mobile and desktop', async ({ page }) => {
  const withoutCitations = (text: string) => text.replace(/\[\d+(?:,\d+)*\]/g, '').trim();
  for (const width of [320, 390, 759, 760, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/observations');
    const guide = page.locator('#observation-guide');
    await guide.locator(':scope > summary').click();
    await expect(guide.getByRole('heading', { name: 'Research behind observations' })).toBeVisible();

    const picker = guide.locator('select#observation-research-topic');
    const tabs = guide.getByRole('navigation', { name: 'Research topics', includeHidden: true });
    await expect(picker.locator('option')).toHaveCount(9);
    await expect(tabs.locator('button')).toHaveCount(9);
    if (width < 760) {
      await expect(picker).toBeVisible();
      await expect(tabs).toBeHidden();
    } else {
      await expect(tabs).toBeVisible();
      await expect(picker).toBeHidden();
    }
    if (width === 390 || width === 1280) {
      await guide.screenshot({ path: `test-results/observation-guide-${width}.png` });
    }

    for (const topic of observationGuide.sections) {
      if (width < 760) await picker.selectOption(topic.id);
      else await tabs.getByRole('button', { name: topic.title, exact: true }).click();
      const panel = guide.locator('#observation-guide-panel');
      await expect(panel.getByRole('heading', { name: topic.title, exact: true })).toBeVisible();
      const paragraphs = await panel.locator(':scope > p').allTextContents();
      expect(paragraphs.map(withoutCitations)).toEqual(topic.content.flatMap((block) => 'text' in block && typeof block.text === 'string' ? [withoutCitations(block.text)] : []));
      await expect(panel.locator('details')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      if (topic.id === 'examples' && (width === 390 || width === 1280)) {
        await panel.screenshot({ path: `test-results/observation-guide-examples-${width}.png` });
      }
    }

    await expect(guide.locator('[id^="observation-guide-source-"]')).toHaveCount(18);
    await expect(guide.locator('#observation-guide-source-gollwitzer-sheeran')).toContainText('[18] Gollwitzer');
    for (const source of observationGuide.sources) {
      const link = guide.locator(`#observation-guide-source-${source.id}`).getByRole('link');
      await expect(link).toHaveText(source.url);
      await expect(link).toHaveAttribute('href', source.url);
    }
    if (width === 390 || width === 1280) {
      await guide.locator('#observation-guide-source-nock-kurtz').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/observation-guide-sources-${width}.png` });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test('research topics and reference URLs remain contained with doubled phone text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/observations');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const guide = page.locator('#observation-guide');
  await guide.locator(':scope > summary').click();
  const picker = guide.getByRole('combobox', { name: 'Research topic', exact: true });
  await expect(picker).toBeVisible();
  await picker.selectOption('references');
  await expect(guide.locator('[id^="observation-guide-source-"]')).toHaveCount(18);
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflow: [...document.querySelectorAll<HTMLElement>('body *')].flatMap((element) => {
      const box = element.getBoundingClientRect();
      if (!box.width || box.right <= document.documentElement.clientWidth) return [];
      const style = getComputedStyle(element);
      return [{ tag: element.tagName, class: element.className, text: element.textContent?.trim().slice(0, 50),
        left: box.left, right: box.right, width: box.width, minWidth: style.minWidth, display: style.display }];
    }).slice(0, 18),
  }));
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    { message: JSON.stringify(layout) }).toBe(true);
  for (const source of observationGuide.sources) {
    const link = guide.locator(`#observation-guide-source-${source.id}`).getByRole('link');
    await link.scrollIntoViewIfNeeded();
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x, source.id).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, source.id).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/observation-guide-sources-large-text-320.png' });
});

test('a study citation opens the matching reference without nested accordions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observations');
  const guide = page.locator('#observation-guide');
  await guide.locator(':scope > summary').click();

  const citation = guide.getByRole('link', { name: 'Reference 1: Nock & Kurtz' }).first();
  await citation.click();
  const source = guide.locator('#observation-guide-source-nock-kurtz');
  await expect(source).toBeVisible();
  await expect(source).toContainText('[1] Nock, M. K., & Kurtz, S. M. S. (2005)');
  await expect(source).toBeFocused();
  await expect(source.locator('a')).toHaveAttribute('href', 'https://www.sciencedirect.com/science/article/pii/S1077722905800586');
  await expect(guide.locator('select#observation-research-topic')).toHaveValue('references');
});

test('grouped introduction references open and focus each matching source repeatedly', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/observations');
    const guide = page.locator('#observation-guide');
    await guide.locator(':scope > summary').click();
    for (const [number, sourceId] of [[5, 'adriani'], [6, 'epinat-duclos'], [5, 'adriani']] as const) {
      const citation = guide.getByRole('link', { name: new RegExp(`^Reference ${number}:`) }).first();
      await citation.focus();
      await page.keyboard.press('Enter');
      const source = guide.locator(`#observation-guide-source-${sourceId}`);
      await expect(source).toBeFocused();
      await expect(source).toBeInViewport();
      await expect(guide.locator('select#observation-research-topic')).toHaveValue('references');
    }
  }
});
