import { expect, test } from './fixtures';

test('Safety shows only protected human strategies and two cited system strategies', async ({ page }) => {
  await page.goto('/needs/safety');

  const deck = page.locator('[data-strategy-deck]');
  await expect(deck.locator('article')).toHaveCount(9);

  for (const title of [
    'Crunch the numbers',
    'Stare off',
    'Self holding',
    'Snuggle a pet',
    'Road trip',
    'Watch a comfort show',
    'Comfy gaming',
    '5-4-3-2-1 check',
    'Slow breathing',
  ]) {
    await expect(deck.getByRole('heading', { name: title })).toHaveCount(1);
  }

  const groundingCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: '5-4-3-2-1 check' }) });
  await expect(groundingCard.getByRole('link', { name: 'Evidence' })).toHaveAttribute(
    'href',
    'https://www.sciencedirect.com/science/article/pii/S1557308725002999',
  );

  const breathingCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Slow breathing' }) });
  await expect(breathingCard.getByRole('link', { name: 'Evidence' })).toHaveAttribute(
    'href',
    'https://pubmed.ncbi.nlm.nih.gov/38137060/',
  );

  for (const title of [
    'Back to wall lean',
    'Butterfly taps',
    'Hand on heart breaths',
    'Floor starfish',
    'Feel your feet',
    'Wrap in a blanket',
    'Name support options',
    'Exit Count',
    'Seat Press',
  ]) {
    await expect(deck.getByRole('heading', { name: title })).toHaveCount(0);
  }
});
