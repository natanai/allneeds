import { describe, expect, it } from 'vitest';

import {
  catalogProvenance,
  fauxFeelings,
  fauxFeelingsBySlug,
  feelings,
  feelingsBySlug,
  needs,
  needsBySlug,
  strategies,
  strategiesBySlug,
} from './catalog';

function expectUniqueSlugs(entries: Array<{ slug: string }>) {
  expect(new Set(entries.map((entry) => entry.slug)).size).toBe(entries.length);
}

describe('production catalog snapshot', () => {
  it('records the exact source commit', () => {
    expect(catalogProvenance.commit).toBe('7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3');
  });

  it('contains every canonical production record with stable unique slugs', () => {
    expect(feelings).toHaveLength(48);
    expect(needs).toHaveLength(67);
    expect(fauxFeelings).toHaveLength(56);
    expect(strategies).toHaveLength(137);
    [feelings, needs, fauxFeelings, strategies].forEach(expectUniqueSlugs);
  });

  it('includes curated user-contributed strategies in their supported needs', () => {
    expect(strategiesBySlug.get('comfy-gaming')).toMatchObject({
      title: 'Comfy gaming',
      summary: 'Stardew Valley or Skyrim or something else I have played a million times before that I cherish and can decompress with after a long day of uncomfortability.',
      supportedNeeds: [{ title: 'Safety', slug: 'safety' }],
      contributor: { name: 'Autumn' },
    });
    expect(needsBySlug.get('safety')?.strategies).toContainEqual({
      title: 'Comfy gaming',
      slug: 'comfy-gaming',
    });
  });

  it('keeps every catalog relationship pointed at an existing public record', () => {
    feelings.forEach((feeling) => {
      feeling.needs.forEach((need) => expect(needsBySlug.has(need.slug), `${feeling.slug} → need ${need.slug}`).toBe(true));
      feeling.fauxFeelings.forEach((faux) => expect(fauxFeelingsBySlug.has(faux.slug), `${feeling.slug} → faux feeling ${faux.slug}`).toBe(true));
    });
    needs.forEach((need) => {
      need.feelings.forEach((feeling) => expect(feelingsBySlug.has(feeling.slug), `${need.slug} → feeling ${feeling.slug}`).toBe(true));
      need.fauxFeelings.forEach((faux) => expect(fauxFeelingsBySlug.has(faux.slug), `${need.slug} → faux feeling ${faux.slug}`).toBe(true));
      need.strategies.forEach((strategy) => expect(strategiesBySlug.has(strategy.slug), `${need.slug} → strategy ${strategy.slug}`).toBe(true));
    });
    fauxFeelings.forEach((faux) => {
      faux.feelings.forEach((feeling) => expect(feelingsBySlug.has(feeling.slug), `${faux.slug} → feeling ${feeling.slug}`).toBe(true));
      faux.needs.forEach((need) => expect(needsBySlug.has(need.slug), `${faux.slug} → need ${need.slug}`).toBe(true));
    });
    strategies.forEach((strategy) => {
      strategy.supportedNeeds.forEach((need) => expect(needsBySlug.has(need.slug), `${strategy.slug} → need ${need.slug}`).toBe(true));
    });
  });
});
