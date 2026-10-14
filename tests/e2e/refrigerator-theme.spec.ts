import type { Page } from '@playwright/test';

import refrigeratorTheme from '../../src/features/customizer/refrigeratorTheme.json' with { type: 'json' };
import { expect, test } from './fixtures';

async function seedTheme(page: Page, previous = false) {
  await page.addInitScript(({ theme, previous }) => {
    if (localStorage.getItem('nvcApp.theme')) return;
    localStorage.setItem('nvcApp.theme', JSON.stringify({
      values: previous ? theme.previousValues : theme.values,
      preset: theme.name, roundness: 0, updatedAt: 123,
      ...(previous ? {} : { appearance: theme.appearance }),
    }));
  }, { theme: refrigeratorTheme, previous });
}

// Check rendered text against its composed background, including translucent
// controls and color-mix values. Decorative art is guarded by opaque label paper.
async function lowContrastText(page: Page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    function rgba(color: string) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).map((v, i) => i === 3 ? v / 255 : v);
    }
    function over(fg: number[], bg: number[]) {
      return [0, 1, 2].map((i) => fg[i]! * fg[3]! + bg[i]! * (1 - fg[3]!)).concat(1);
    }
    function luminance(color: number[]) {
      const c = color.slice(0, 3).map((v) => v / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return .2126 * c[0]! + .7152 * c[1]! + .0722 * c[2]!;
    }
    const base = rgba(getComputedStyle(document.documentElement).getPropertyValue('--primary').trim());
    const failures: string[] = [];
    for (const element of document.querySelectorAll<HTMLElement>('main *, nav *, [role="dialog"] *')) {
      const placeholder = element.matches('input, textarea') && !(element as HTMLInputElement).value
        ? element.getAttribute('placeholder') : null;
      const text = placeholder || Array.from(element.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join('').trim();
      if (!text || element.matches('option, script, style, svg *:not(text), .visually-hidden')) continue;
      if (element.closest('svg[aria-hidden="true"]')) continue;
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (!box.width || !box.height || style.visibility === 'hidden' || style.display === 'none') continue;
      const chain: HTMLElement[] = [];
      let hidden = false;
      for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
        chain.push(parent);
        if (parent.matches('[disabled], [aria-disabled="true"], .visually-hidden') || Number(getComputedStyle(parent).opacity) === 0) hidden = true;
      }
      if (hidden) continue;
      let bg = base;
      for (const parent of chain.reverse()) bg = over(rgba(getComputedStyle(parent).backgroundColor), bg);
      const textColor = placeholder ? getComputedStyle(element, '::placeholder').color
        : element.tagName.toLowerCase() === 'text' ? style.fill : style.color;
      const fg = over(rgba(textColor), bg);
      const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
      const ratio = (light! + .05) / (dark! + .05);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseFloat(style.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5)) failures.push(`${element.tagName} ${text.slice(0, 55)}: ${ratio.toFixed(2)}`);
    }
    return failures;
  });
}

const routes = ['/', '/needs', '/needs/connection', '/needs/safety', '/feelings', '/feelings/hurt', '/faux-feelings', '/faux-feelings/abandoned', '/observations', '/inventory', '/feed', '/inventory/journal', '/feelings/body-cues', '/feelings/emotions-wheel', '/alexithymia-support'];

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test.describe(`${viewport.width}px refrigerator material`, () => {
    test.use({ viewport });
    test('keeps all page families readable and within the viewport', async ({ page }) => {
      test.setTimeout(90_000);
      await seedTheme(page);
      const problems: string[] = [];
      const contrastProblems: Record<string, string[]> = {};
      page.on('pageerror', (error) => problems.push(error.message));
      for (const route of routes) {
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('data-app-state', 'ready');
        await expect(page.getByLabel('Primary navigation magnets')).toHaveAttribute('data-ready', 'true');
        await expect(page.locator('main').getByRole('heading', { level: 1 }).first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
        const contrast = await lowContrastText(page);
        if (contrast.length) contrastProblems[route] = contrast;
      }
      expect(problems).toEqual([]);
      expect(contrastProblems).toEqual({});
    });

    test('retains material when customizing and restores standard presentation on another preset', async ({ page }) => {
      await page.goto('/needs');
      const nav = page.getByLabel('Primary navigation magnets');
      await nav.getByRole('button', { name: 'Customizer', exact: true }).click();
      const customizer = page.getByRole('dialog', { name: 'Customizer', exact: true });
      await customizer.getByLabel('Preset', { exact: true }).selectOption('Refrigerator');
      await expect(page.locator('html')).toHaveAttribute('data-theme-appearance', 'refrigerator');
      const color = customizer.getByRole('textbox', { name: 'Action emphasis', exact: true });
      await color.fill('#DED8C8');
      await color.press('Enter');
      await customizer.getByLabel(/Corner roundness/).focus();
      await customizer.getByLabel(/Corner roundness/).press('End');
      await customizer.getByRole('button', { name: 'Close customizer' }).click();
      await expect(nav.locator('[data-magnet-id="nav-needs"]')).toHaveCSS('text-transform', 'none');
      const toggle = nav.getByRole('switch');
      const toggleBox = await toggle.locator('..').boundingBox();
      expect(toggleBox?.width).toBeGreaterThanOrEqual(43.9);
      expect(toggleBox?.height).toBeGreaterThanOrEqual(43.9);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme-appearance', 'refrigerator');
      await nav.getByRole('button', { name: 'Customizer', exact: true }).click();
      await expect(customizer.getByRole('textbox', { name: 'Action emphasis', exact: true })).toHaveValue('#DED8C8');
      expect(await lowContrastText(page)).toEqual([]);
      await customizer.getByLabel('Preset', { exact: true }).selectOption('Default');
      await customizer.getByRole('button', { name: 'Close customizer' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme-appearance', 'standard');
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#FFFFFF');
      await expect(nav.locator('[data-magnet-id="nav-needs"]')).toHaveCSS('text-transform', 'uppercase');
    });

    test('preserves readable Journal, selection sheets, check-in steps, and graph detail', async ({ page }) => {
      await seedTheme(page);
      await page.goto('/inventory/journal?compose=new');
      const journal = page.getByRole('dialog', { name: 'Journal', exact: true });
      await journal.getByLabel('Reflection', { exact: true }).fill('Paper on the refrigerator.');
      await journal.getByRole('button', { name: 'Feeling', exact: true }).click();
      const feelings = page.getByRole('dialog', { name: 'Feelings', exact: true });
      expect(await lowContrastText(page)).toEqual([]);
      await feelings.getByRole('button', { name: 'Close Feelings' }).click();
      await journal.getByRole('button', { name: 'Needs', exact: true }).click();
      const needs = page.getByRole('dialog', { name: 'Needs', exact: true });
      expect(await lowContrastText(page)).toEqual([]);
      await needs.getByRole('button', { name: 'Done', exact: true }).click();
      await journal.locator('summary').filter({ hasText: 'Emotional coordinates' }).click();
      await expect(journal.getByTestId('valence-arousal-field')).toBeVisible();
      expect(await lowContrastText(page)).toEqual([]);
      await journal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(journal).toHaveCount(0);
      await page.getByLabel('Period', { exact: true }).selectOption('all');
      await expect(page.getByRole('group', { name: /Valence and arousal, both minus 5 to plus 5 over time/ })).toBeVisible();
      expect(await lowContrastText(page)).toEqual([]);
      await page.goto('/alexithymia-support');
      await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
      expect(await lowContrastText(page)).toEqual([]);
    });
  });
}

test('migrates the old saved preset before the React bundle can paint', async ({ page }) => {
  await seedTheme(page, true);
  await page.route('**/assets/index-*.js', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme-appearance', 'refrigerator');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', refrigeratorTheme.values.primary);
  expect(await page.locator('html').evaluate((root) => ({
    primary: (root as HTMLElement).style.getPropertyValue('--primary'),
    paper: (root as HTMLElement).style.getPropertyValue('--surface-raised'),
  }))).toEqual({ primary: refrigeratorTheme.values.primary, paper: refrigeratorTheme.values.quiet });
});
