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
import editorialCatalog from './editorialCatalog.json';
import userStrategies from './userStrategies.json';
import legacyData from './generated/legacyData.json';

function expectUniqueSlugs(entries: Array<{ slug: string }>) {
  expect(new Set(entries.map((entry) => entry.slug)).size).toBe(entries.length);
}

type LocatedUrl = { path: string; url: string };

function collectUrls(value: unknown, path = 'editorialCatalog'): LocatedUrl[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectUrls(entry, `${path}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
    const entryPath = `${path}.${key}`;
    if (key === 'url' && typeof entry === 'string') return [{ path: entryPath, url: entry }];
    return collectUrls(entry, entryPath);
  });
}

function expectHumanFacingRawUrl({ path, url }: LocatedUrl) {
  const parsed = new URL(url);
  expect(['http:', 'https:'], `${path} must be an HTTP(S) URL`).toContain(parsed.protocol);

  const hostname = parsed.hostname.toLowerCase();
  expect(hostname, `${path} must not point to a ChatGPT intermediary`).not.toBe('chatgpt.com');
  expect(hostname, `${path} must not point to a ChatGPT intermediary`).not.toBe('www.chatgpt.com');
  expect(hostname, `${path} must not point to a legacy ChatGPT intermediary`).not.toBe('chat.openai.com');

  const forbiddenExactParams = new Set(['gclid', 'fbclid', 'mc_cid', 'mc_eid', '_ga']);
  parsed.searchParams.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    expect(normalizedKey.startsWith('utm_'), `${path} must not contain tracking parameter ${key}`).toBe(false);
    expect(forbiddenExactParams.has(normalizedKey), `${path} must not contain tracking parameter ${key}`).toBe(false);
    expect(
      normalizedKey === 'origin' && value.toLowerCase() === 'crossref',
      `${path} must not retain the nonessential origin=crossref referral parameter`,
    ).toBe(false);
    expect(value.toLowerCase().includes('chatgpt.com'), `${path} must not route through ChatGPT`).toBe(false);
  });
}

describe('production catalog snapshot', () => {
  it('records the exact source commit', () => {
    expect(catalogProvenance.commit).toBe('7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3');
  });

  it('keeps canonical editorial citation URLs raw and human-facing', () => {
    const editorialUrls = collectUrls(editorialCatalog);
    expect(editorialUrls.length).toBeGreaterThan(0);
    editorialUrls.forEach(expectHumanFacingRawUrl);
  });

  it('contains the imported catalog plus reviewed editorial changes and protected user strategies', () => {
    expect(feelings).toHaveLength(48);
    expect(needs).toHaveLength(67);
    expect(fauxFeelings).toHaveLength(56);

    const discardedStrategySlugs = new Set(editorialCatalog.discardedStrategySlugs ?? []);
    const expectedStrategySlugs = new Set([
      ...legacyData.strategies.map((strategy) => strategy.slug),
      ...editorialCatalog.strategies.map((strategy) => strategy.slug),
      ...userStrategies.map((strategy) => strategy.slug),
    ].filter((slug) => !discardedStrategySlugs.has(slug)));

    expect(strategies.map((strategy) => strategy.slug).sort()).toEqual([...expectedStrategySlugs].sort());
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
      expect(strategy?.evidence?.kind).toBe('scholarly');
      expect(strategy?.evidence?.url).toMatch(/^https:\/\//);
    });
    expect(strategiesBySlug.has('one-kind-text')).toBe(false);
    expect(strategiesBySlug.has('specific-thank-you')).toBe(false);
    expect(needsBySlug.get('connection')?.strategies.some((strategy) => strategy.slug === 'ambient-postcard')).toBe(false);
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

    ['map-your-support', 'prepare-one-request-for-help'].forEach((slug) => {
      const strategy = strategiesBySlug.get(slug);
      expect(strategy?.provenance).toBe('system');
      expect(strategy?.evidence?.kind).toBe('scholarly');
      expect(strategy?.evidence?.url).toMatch(/^https:\/\//);
    });
    ['call-or-text-988', 'call-116-123'].forEach((slug) => {
      const strategy = strategiesBySlug.get(slug);
      expect(strategy?.provenance).toBe('system');
      expect(strategy?.evidence?.kind).toBe('official-resource');
      expect(strategy?.supportedNeeds.map((need) => need.slug)).toEqual(expect.arrayContaining(['support', 'safety']));
    });
    ['floor-starfish', 'pillow-nest', 'name-support-options', 'name-one-help-to-ask'].forEach((slug) => {
      expect(strategiesBySlug.get(slug)?.supportedNeeds.some((need) => need.slug === 'support')).toBe(false);
    });
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
    expect(strategiesBySlug.get('5-4-3-2-1-check')?.evidence?.kind).toBe('clinical-guidance');
    expect(strategiesBySlug.get('slow-breathing-safety')?.evidence?.kind).toBe('scholarly');
  });

  it('keeps every catalog relationship pointed at an existing public record', () => {
    feelings.forEach((feeling) => {
      feeling.needs.forEach((need) => expect(needsBySlug.has(need.slug)).toBe(true));
      feeling.fauxFeelings.forEach((fauxFeeling) => expect(fauxFeelingsBySlug.has(fauxFeeling.slug)).toBe(true));
    });
    fauxFeelings.forEach((fauxFeeling) => {
      fauxFeeling.feelings.forEach((feeling) => expect(feelingsBySlug.has(feeling.slug)).toBe(true));
      fauxFeeling.needs.forEach((need) => expect(needsBySlug.has(need.slug)).toBe(true));
    });
    needs.forEach((need) => {
      need.feelings.forEach((feeling) => expect(feelingsBySlug.has(feeling.slug)).toBe(true));
      need.fauxFeelings.forEach((fauxFeeling) => expect(fauxFeelingsBySlug.has(fauxFeeling.slug)).toBe(true));
      need.strategies.forEach((strategy) => expect(strategiesBySlug.has(strategy.slug)).toBe(true));
    });
    strategies.forEach((strategy) => {
      strategy.supportedNeeds.forEach((need) => expect(needsBySlug.has(need.slug)).toBe(true));
    });
  });
});
