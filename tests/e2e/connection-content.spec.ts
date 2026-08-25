import { expect, test } from './fixtures';

test.describe('Connection reviewed content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/needs/connection');
  });

  test('shows the approved evidence package and human-verifiable citations', async ({ page }) => {
    await expect(page.getByText('As a highly social species, humans appear to have evolved strong motivations to maintain connection with others.')).toBeVisible();

    await page.getByText('Details', { exact: true }).click();
    const detailParagraphs = page.locator('section[aria-labelledby="need-evidence-heading"] details').first().locator('p');
    await expect(detailParagraphs).toHaveCount(4);
    await expect(detailParagraphs.first()).toContainText('survived and prospered by banding together');

    await page.getByText('Citations', { exact: true }).click();
    const citationLinks = page.locator('section[aria-labelledby="need-evidence-heading"] ol a');
    await expect(citationLinks).toHaveCount(6);
    await expect(citationLinks.nth(0)).toHaveAttribute('href', 'https://psycnet.apa.org/record/1995-29052-001');
    await expect(citationLinks.nth(3)).toHaveAttribute('href', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3855545/');
  });

  test('shows only the approved Connection strategy set with parallel provenance', async ({ page }) => {
    const deck = page.locator('[data-strategy-deck]');
    await expect(deck.locator('article')).toHaveCount(7);

    const userCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Call a friend' }) });
    await expect(userCard).toContainText('Nat');
    await expect(userCard.getByRole('link', { name: 'Evidence' })).toHaveCount(0);

    const systemCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Write a letter' }) });
    await expect(systemCard.getByRole('link', { name: 'Evidence' })).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/40643373/');

    await expect(deck.getByRole('heading', { name: 'One kind text' })).toHaveCount(0);
    await expect(deck.getByRole('heading', { name: 'Specific thank-you' })).toHaveCount(0);
    await expect(deck.getByRole('heading', { name: 'Ambient Postcard' })).toHaveCount(0);
  });
});
