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
import userStrategies from './userStrategies.json';
import legacyData from './generated/legacyData.json';

function expectUniqueSlugs(entries: Array<{ slug: string }>) {
  expect(new Set(entries.map((entry) => entry.slug)).size).toBe(entries.length);
}

describe('production catalog snapshot', () => {
  it('records the exact source commit', () => {
    expect(catalogProvenance.commit).toBe('7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3');
  });

  it('contains the imported catalog plus reviewed editorial changes and curated user strategies', () => {
    expect(feelings).toHaveLength(48);
    expect(needs).toHaveLength(67);
    expect(fauxFeelings).toHaveLength(56);
    expect(strategies).toHaveLength(legacyData.strategies.length - 2 + 9 + userStrategies.length);
    [feelings, needs, fauxFeelings, strategies].forEach(expectUniqueSlugs);
  });

  it('keeps profile-owned Nat strategies out of repository catalog data', () => {
    const repositoryProfileStrategies = legacyData.strategies.filter((strategy: unknown) => {
      const candidate = strategy as {
        contributorName?: string;
        contributorLocation?: string;
        contributor?: { name?: string; location?: string };
      };
      const name = candidate.contributor?.name ?? candidate.contributorName;
      const location = candidate.contributor?.location ?? candidate.contributorLocation;
      return name?.trim().toLowerCase() === 'nat'
        && location?.trim().toLowerCase() === 'missouri';
    });

    expect(repositoryProfileStrategies).toEqual([]);
  });

  it('includes curated user-contributed strategies in their supported needs', () => {
    expect(strategiesBySlug.get('comfy-gaming')).toMatchObject({
      title: 'Comfy gaming',
      summary: 'Stardew Valley or Skyrim or something else I have played a million times before that I cherish and can decompress with after a long day of uncomfortability.',
      supportedNeeds: [{ title: 'Safety', slug: 'safety' }],
      provenance: 'user',
      contributor: { name: 'Autumn' },
    });
    expect(needsBySlug.get('safety')?.strategies).toContainEqual({
      title: 'Comfy gaming',
      slug: 'comfy-gaming',
    });
  });

  it('ships the approved Connection copy, citations, strategies, provenance, and removals', () => {
    const connection = needsBySlug.get('connection');
    expect(connection?.summary).toBe(
      'As a highly social species, humans appear to have evolved strong motivations to maintain connection with others. Across human evolutionary history, social bonds supported protection, caregiving, cooperation, and group living, making social connection consequential for survival and reproduction across generations. This need may drive us to seek others, maintain relationships, repair social ruptures, and coordinate with the people around us. Evolutionary accounts propose that even the discomfort of disconnection may help motivate behavior directed toward restoring socially important bonds.',
    );
    expect(connection?.evidence?.sources).toHaveLength(6);
    expect(connection?.strategies).toEqual([
      { title: 'Write a letter', slug: 'write-a-letter-for-connection' },
      { title: 'Remember a connected moment', slug: 'remember-a-connected-moment' },
      { title: 'Map your connection options', slug: 'map-your-connection-options' },
      { title: 'Notice where you are', slug: 'notice-where-you-are' },
    ]);

    ['write-a-letter-for-connection', 'remember-a-connected-moment', 'map-your-connection-options', 'notice-where-you-are'].forEach((slug) => {
      const strategy = strategiesBySlug.get(slug);
      expect(strategy?.provenance).toBe('system');
      expect(strategy?.evidence?.url).toMatch(/^https:\/\//);
      expect(strategy?.supportedNeeds).toContainEqual({ title: 'Connection', slug: 'connection' });
    });

    expect(strategiesBySlug.has('one-kind-text')).toBe(false);
    expect(strategiesBySlug.has('specific-thank-you')).toBe(false);
    expect(strategiesBySlug.get('ambient-postcard')?.supportedNeeds).not.toContainEqual({
      title: 'Connection',
      slug: 'connection',
    });
  });

  it('ships the approved Support copy, citations, strategies, provenance, and removals', () => {
    const support = needsBySlug.get('support');
    expect(support?.summary).toBe(
      'Across human evolutionary history, survival often depended on sharing food, care, information, labor, and risk rather than meeting every demand alone. This need may draw us to seek help, make our needs visible, notice when others need assistance, and offer or accept emotional, informational, or practical support. Tending to support can distribute burdens, preserve capacity during hardship, and make difficult circumstances more manageable than they would be alone.',
    );
    expect(support?.evidence?.sources).toHaveLength(8);
    expect(support?.strategies).toEqual([
      { title: 'Map your support', slug: 'map-your-support' },
      { title: 'Prepare one request for help', slug: 'prepare-one-request-for-help' },
      { title: 'Call or text 988', slug: 'call-or-text-988' },
      { title: 'Call 116 123', slug: 'call-116-123' },
    ]);

    expect(strategiesBySlug.get('map-your-support')).toMatchObject({
      provenance: 'system',
      evidence: {
        url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0233535',
        kind: 'scholarly',
      },
    });
    expect(strategiesBySlug.get('prepare-one-request-for-help')).toMatchObject({
      provenance: 'system',
      evidence: {
        url: 'https://pubmed.ncbi.nlm.nih.gov/36067802/',
        kind: 'scholarly',
      },
    });

    for (const slug of ['call-or-text-988', 'call-116-123']) {
      expect(strategiesBySlug.get(slug)).toMatchObject({
        provenance: 'system',
        evidence: { kind: 'official-resource' },
        supportedNeeds: expect.arrayContaining([
          { title: 'Support', slug: 'support' },
          { title: 'Safety', slug: 'safety' },
        ]),
      });
    }

    for (const slug of ['floor-starfish', 'pillow-nest', 'name-support-options', 'name-one-help-to-ask']) {
      expect(strategiesBySlug.get(slug)?.supportedNeeds).not.toContainEqual({ title: 'Support', slug: 'support' });
    }
  });

  it('keeps profile-owned strategies out of the approved Safety static deck', () => {
    const safety = needsBySlug.get('safety');
    expect(safety?.strategies.map((strategy) => strategy.slug)).toEqual([
      'comfy-gaming',
      '5-4-3-2-1-check',
      'slow-breathing-safety',
      'call-or-text-988',
      'call-116-123',
    ]);
    expect(strategiesBySlug.get('comfy-gaming')?.provenance).toBe('user');

    [
      'back-to-wall-lean',
      'butterfly-taps',
      'hand-on-heart-breaths',
      'floor-starfish',
      'feel-your-feet',
      'wrap-in-a-blanket',
      'name-support-options',
      'exit-count',
      'seat-press',
    ].forEach((slug) => {
      expect(strategiesBySlug.get(slug)?.supportedNeeds).not.toContainEqual({ title: 'Safety', slug: 'safety' });
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
