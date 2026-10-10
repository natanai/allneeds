import { expect, test } from './fixtures';

test('Safety excludes migrated profile strategies while retaining the curated community card, cited system strategies, and support lines', async ({ page }) => {
  await page.goto('/needs/safety');

  const deck = page.locator('[data-strategy-deck]');
  await expect(deck.locator('article')).toHaveCount(5);

  for (const title of [
    'Comfy gaming',
    'Orient with 5-4-3-2-1',
    'Slow your breathing',
    'Call or text 988',
    'Call 116 123',
  ]) {
    await expect(deck.locator('h3').filter({ hasText: title })).toHaveCount(1);
  }

  const groundingCard = deck.locator('article').filter({ hasText: 'Orient with 5-4-3-2-1' });
  await expect(groundingCard.locator('a[aria-label="Supporting source: Frimley Health NHS Foundation Trust. Anxiety information pack: 5-4-3-2-1 grounding technique."]')).toHaveAttribute(
    'href',
    'https://www.fhft.nhs.uk/patients-and-visitors/patient-information-library/anxiety-information-pack',
  );

  const breathingCard = deck.locator('article').filter({ hasText: 'Slow your breathing' });
  await expect(breathingCard.locator('a[aria-label="Supporting source: Breathing Practices for Stress and Anxiety Reduction: Conceptual Framework of Implementation Guidelines Based on a Systematic Review of the Published Literature"]')).toHaveAttribute(
    'href',
    'https://pubmed.ncbi.nlm.nih.gov/38137060/',
  );

  const usSupportCard = deck.locator('article').filter({ hasText: 'Call or text 988' });
  await expect(usSupportCard.locator('a[aria-label="Supporting source: 988 Suicide & Crisis Lifeline"]'))
    .toHaveAttribute('href', 'https://988lifeline.org/');

  const euSupportCard = deck.locator('article').filter({ hasText: 'Call 116 123' });
  await expect(euSupportCard.locator('a[aria-label="Supporting source: 116 123 — Emotional support helplines"]'))
    .toHaveAttribute(
      'href',
      'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/faq/index_en.htm',
    );

  for (const title of [
    'Crunch the numbers',
    'Stare off',
    'Self holding',
    'Snuggle a pet',
    'Road trip',
    'Watch a comfort show',
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
    await expect(deck.locator('h3').filter({ hasText: title })).toHaveCount(0);
  }
});
