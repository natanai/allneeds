import { expect, test } from './fixtures';

test.describe('Support reviewed content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/needs/support');
  });

  test('shows the approved evolutionary-therapeutic copy and eight direct citations', async ({ page }) => {
    await expect(page.getByText('Across human evolutionary history, survival often depended on sharing food, care, information, labor, and risk rather than meeting every demand alone.')).toBeVisible();

    await page.getByText('Details', { exact: true }).click();
    const detailParagraphs = page.locator('section[aria-labelledby="need-evidence-heading"] details').first().locator('p');
    await expect(detailParagraphs).toHaveCount(6);
    await expect(detailParagraphs.first()).toContainText('central role in shaping evolved human life history');
    await expect(detailParagraphs.last()).toContainText('deeply cooperative human repertoire');

    await page.getByText('Citations', { exact: true }).click();
    const citationList = page.locator('section[aria-labelledby="need-evidence-heading"] ol');
    const citationLinks = citationList.locator('a');
    await expect(citationLinks).toHaveCount(8);
    await expect(citationLinks.nth(0)).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/23943272/');
    await expect(citationLinks.nth(7)).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/41100292/');
    await expect(citationList).not.toContainText('Use for:');
    await expect(citationList).not.toContainText('Limitation:');
  });

  test('shows exactly the approved six Support strategies with parallel provenance', async ({ page }) => {
    const deck = page.locator('[data-strategy-deck]');
    await expect(deck.locator('article')).toHaveCount(6);

    for (const title of [
      'Call a friend',
      'Call a parent',
      'Map your support',
      'Prepare one request for help',
      'Call or text 988',
      'Call 116 123',
    ]) {
      await expect(deck.getByRole('heading', { name: title })).toHaveCount(1);
    }

    const friendCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Call a friend' }) });
    await expect(friendCard).toContainText('Nat');
    await expect(friendCard.getByText('Supporting source ↗')).toHaveCount(0);

    const mappingCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Map your support' }) });
    await expect(mappingCard.getByText('Supporting source ↗')).toHaveAttribute(
      'href',
      'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0233535',
    );

    const requestCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Prepare one request for help' }) });
    await expect(requestCard.getByText('Supporting source ↗')).toHaveAttribute(
      'href',
      'https://pubmed.ncbi.nlm.nih.gov/36067802/',
    );

    const usCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Call or text 988' }) });
    await expect(usCard.getByText('Supporting source ↗')).toHaveAttribute('href', 'https://988lifeline.org/');

    const euCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Call 116 123' }) });
    await expect(euCard.getByText('Supporting source ↗')).toHaveAttribute(
      'href',
      'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/faq/index_en.htm',
    );

    for (const title of ['Floor starfish', 'Pillow nest', 'Name support options', 'Name one help to ask']) {
      await expect(deck.getByRole('heading', { name: title })).toHaveCount(0);
    }
  });
});
