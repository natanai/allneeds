import { expect, test } from './fixtures';

test('Safety shows the approved human, scholarly, and official-resource strategy set', async ({ page }) => {
  await page.goto('/needs/safety');

  const deck = page.locator('[data-strategy-deck]');
  await expect(deck.locator('article')).toHaveCount(9);

  for (const title of [
    'Stare off',
    'Self holding',
    'Snuggle a pet',
    'Watch a comfort show',
    'Comfy gaming',
    '5-4-3-2-1 check',
    'Slow breathing',
    'Call or text 988',
    'Call 116 123',
  ]) {
    await expect(deck.getByRole('heading', { name: title })).toHaveCount(1);
  }

  const groundingCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: '5-4-3-2-1 check' }) });
  await expect(groundingCard.getByRole('link', {
    name: 'Supporting source: Ground yourself: Using five senses technique to cope with test anxiety among nursing students',
  })).toHaveAttribute(
    'href',
    'https://www.sciencedirect.com/science/article/pii/S1557308725002999',
  );

  const breathingCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Slow breathing' }) });
  await expect(breathingCard.getByRole('link', {
    name: 'Supporting source: Breathing Practices for Stress and Anxiety Reduction: Conceptual Framework of Implementation Guidelines Based on a Systematic Review of the Published Literature',
  })).toHaveAttribute(
    'href',
    'https://pubmed.ncbi.nlm.nih.gov/38137060/',
  );

  const usSupportCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Call or text 988' }) });
  await expect(usSupportCard.getByRole('link', { name: 'Supporting source: 988 Suicide & Crisis Lifeline' }))
    .toHaveAttribute('href', 'https://988lifeline.org/');

  const euSupportCard = deck.locator('article').filter({ has: page.getByRole('heading', { name: 'Call 116 123' }) });
  await expect(euSupportCard.getByRole('link', { name: 'Supporting source: 116 123 — Emotional support helplines' }))
    .toHaveAttribute(
      'href',
      'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/faq/index_en.htm',
    );

  for (const title of [
    'Crunch the numbers',
    'Road trip',
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
