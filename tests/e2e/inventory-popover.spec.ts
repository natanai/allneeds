import { expect, test } from './fixtures';

const savedAt = '2026-08-24T10:00:00.000Z';

test('need rows open a compact floating strategy popover without stretching the grid row', async ({ page }) => {
  await page.addInitScript(({ timestamp }) => {
    window.localStorage.setItem('allneeds.v2.inventory', JSON.stringify({
      schemaVersion: 1,
      savedAt: timestamp,
      data: {
        items: [
          {
            id: 'freedom-game',
            title: 'Play a video game',
            description: 'Take a short gaming break.',
            need: 'Freedom',
            needSlug: 'freedom',
            needSlugs: ['freedom'],
            tags: ['freedom'],
            personal: true,
            sourceNeedPage: 'freedom',
            strategySlug: '',
            createdAt: timestamp,
            visibility: 'private',
          },
          {
            id: 'freedom-shake',
            title: 'Shake for 30 seconds',
            description: 'Move freely for half a minute.',
            need: 'Freedom',
            needSlug: 'freedom',
            needSlugs: ['freedom'],
            tags: ['freedom'],
            personal: true,
            sourceNeedPage: 'freedom',
            strategySlug: '',
            createdAt: timestamp,
            visibility: 'private',
          },
        ],
      },
    }));
  }, { timestamp: savedAt });

  await page.goto('/inventory');
  await page.waitForTimeout(220);

  const transformedAncestor = await page.getByRole('heading', { level: 1, name: 'Strategy inventory' }).evaluate((element) => {
    let ancestor = element.parentElement;
    while (ancestor) {
      const transform = getComputedStyle(ancestor).transform;
      if (transform && transform !== 'none') return transform;
      ancestor = ancestor.parentElement;
    }
    return null;
  });
  expect(transformedAncestor).toBeNull();

  const freedomButton = page.getByRole('button', { name: /^Freedom, 2 saved strategies/ });
  const freedomRow = freedomButton.locator('xpath=..');
  const before = await freedomRow.boundingBox();
  expect(before).not.toBeNull();

  await freedomButton.click();
  const popover = page.getByRole('region', { name: 'Freedom strategies' });
  await expect(popover).toBeVisible();
  await expect(popover.getByRole('link', { name: /Freedom/ })).toHaveAttribute('href', '/needs/freedom');
  await expect(popover.getByText('Open a strategy to see its full description and controls.', { exact: true })).toBeHidden();

  const viewAll = popover.getByRole('button', { name: 'View all 2 in Strategies' });
  await expect(viewAll).toBeVisible();
  await expect(viewAll).toHaveCSS('border-top-style', 'none');
  expect(await popover.evaluate((element) => getComputedStyle(element, '::before').content)).toBe('none');

  const after = await freedomRow.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(1);

  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);
  await expect(freedomButton).toBeFocused();

  await freedomButton.click();
  await page.getByRole('button', { name: 'Open Play a video game in Strategies' }).click();

  await expect(page.getByRole('tab', { name: /Strategies/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Showing strategies for', { exact: false })).toContainText('Freedom');
  const strategyCard = page.locator('#inventory-strategy-freedom-game');
  await expect(strategyCard).toBeVisible();
  await expect(strategyCard).toBeFocused();
  await expect(strategyCard.getByRole('heading', { level: 3, name: 'Play a video game' })).toBeVisible();
});

test('direct Edit links prefill the exact strategy search and use the strategy palette cleanly', async ({ page }) => {
  await page.addInitScript(({ timestamp }) => {
    window.localStorage.setItem('allneeds.v2.inventory', JSON.stringify({
      schemaVersion: 1,
      savedAt: timestamp,
      data: {
        items: [{
          id: 'call-parent',
          title: 'Call a parent',
          description: 'Call someone who helps you feel connected.',
          need: 'Connection',
          needSlug: 'connection',
          needSlugs: ['connection'],
          tags: ['connection'],
          personal: true,
          firstName: 'Nat',
          location: 'Missouri',
          sourceNeedPage: 'connection',
          strategySlug: '',
          createdAt: timestamp,
          visibility: 'public',
        }],
      },
    }));
  }, { timestamp: savedAt });

  await page.goto('/inventory?edit=call-parent');

  await expect(page.getByRole('tab', { name: /Strategies/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('searchbox', { name: 'Search saved strategies' })).toHaveValue('Call a parent');
  await expect(page.locator('#strategies-list > article')).toHaveCount(1);

  const card = page.locator('#inventory-strategy-call-parent');
  const description = card.getByRole('textbox', { name: 'Description' });
  await expect(description).toHaveValue('Call someone who helps you feel connected.');
  const styles = await description.evaluate((element) => {
    const wrapper = element.parentElement!;
    const cardElement = element.closest('article')!;
    const textareaRect = element.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    return {
      bottomGap: Math.round(wrapperRect.bottom - textareaRect.bottom),
      cardBackground: getComputedStyle(cardElement).backgroundColor,
      strategyColor: getComputedStyle(document.documentElement).getPropertyValue('--positive').trim(),
      textareaBorder: getComputedStyle(element).borderWidth,
      textareaDisplay: getComputedStyle(element).display,
    };
  });
  expect(styles.bottomGap).toBeLessThanOrEqual(1);
  expect(styles.cardBackground).toBe('rgb(150, 251, 199)');
  expect(styles.strategyColor).toBe('#96FBC7');
  expect(styles.textareaBorder).toBe('0px');
  expect(styles.textareaDisplay).toBe('block');
});
