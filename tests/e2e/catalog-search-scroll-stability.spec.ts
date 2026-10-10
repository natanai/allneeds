import { expect, test } from './fixtures';

test.use({
  viewport: { width: 390, height: 430 },
  hasTouch: true,
  isMobile: true,
});

for (const catalog of [
  { path: '/feelings', search: 'Search feelings', query: 'affectionate' },
  { path: '/needs', search: 'Search needs', query: 'love' },
  { path: '/faux-feelings', search: 'Search faux feelings', query: 'abandoned' },
] as const) {
  test(`${catalog.path} search remains stationary as results contract`, async ({ page }) => {
    await page.goto(catalog.path);
    const search = page.getByPlaceholder(catalog.search);
    await search.evaluate((input) => {
      const documentTop = input.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: documentTop - 72, behavior: 'auto' });
    });
    await search.focus();
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));

    const before = await page.evaluate(() => ({
      scrollY: window.scrollY,
      searchTop: document.activeElement?.getBoundingClientRect().top ?? -1,
    }));
    expect(before.scrollY).toBeGreaterThan(100);

    await search.pressSequentially(catalog.query, { delay: 20 });
    await expect(search).toHaveValue(catalog.query);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));

    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      searchTop: document.activeElement?.getBoundingClientRect().top ?? -1,
    }));
    expect(Math.abs(after.scrollY - before.scrollY)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.searchTop - before.searchTop)).toBeLessThanOrEqual(1);
  });
}
