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
    expect(strategies).toHaveLength(136 - 2 + 4 + userStrategies.length);
    [feelings, needs, fauxFeelings, strategies].forEach(expectUniqueSlugs);
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
      { title: 'Call a friend', slug: 'call-a-friend' },
      { title: 'Play a social video game', slug: 'play-a-social-video-game' },
      { title: 'Read a character driven novel', slug: 'read-a-character-driven-novel' },
      { title: 'Write a letter', slug: 'write-a-letter-for-connection' },
      { title: 'Remember a connected moment', slug: 'remember-a-connected-moment' },
      { title: 'Map your connection options', slug: 'map-your-connection-options' },
      { title: 'Notice where you are', slug: 'notice-where-you-are' },
    ]);

    ['call-a-friend', 'play-a-social-video-game', 'read-a-character-driven-novel'].forEach((slug) => {
      expect(strategiesBySlug.get(slug)?.provenance).toBe('user');
    });

    ['write-a-letter-for-connection', 'remember-a-connected-moment', 'map-your-connection-options', 'notice-where-you-are'].forEach((slug) => {
      const strategy = strategiesBySlug.get(slug);
      expect(strategy?.provenance).toBe('system');
      expect(strategy?.evidence?.url).toMatch(/^https:\/\//);
      expect(strategy?.supportedNeeds).toContainEqual({ title: 'Connection', slug: 'connection' });
    });

    expect(strategiesBySlug.get('write-a-letter')).toMatchObject({
      title: 'Write a letter',
      summary: 'To a friend or a senator. Advocate for yourself or others.',
      provenance: 'user',
      contributor: { name: 'Nat', location: 'Missouri' },
    });
    expect(strategiesBySlug.get('write-a-letter')?.supportedNeeds).not.toContainEqual({
      title: 'Connection',
      slug: 'connection',
    });

    expect(strategiesBySlug.has('one-kind-text')).toBe(false);
    expect(strategiesBySlug.has('specific-thank-you')).toBe(false);
    expect(strategiesBySlug.get('ambient-postcard')?.supportedNeeds).not.toContainEqual({
      title: 'Connection',
      slug: 'connection',
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
