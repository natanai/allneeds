import { describe, expect, it } from 'vitest';

import { needsBySlug, strategiesBySlug } from './catalog';

describe('approved Understanding audit package', () => {
  it('ships the approved umbrella copy and two evidence lenses', () => {
    const understanding = needsBySlug.get('understanding');

    expect(understanding?.summary).toBe(
      "Humans and other animals actively seek information when uncertainty matters, and human cooperation often involves coordinating attention, intentions, and meanings with other people. This need may draw us to ask questions, seek explanations, check assumptions, make our own thinking easier to grasp, and listen for what we may have missed. Understanding does not require certainty or agreement. Sometimes tending it means building a clearer picture of what is happening; sometimes it means finding where two people's meanings align or differ.",
    );
    expect(understanding?.evidence?.narrative).toBe('');
    expect(understanding?.evidence?.sources).toEqual([]);

    expect(understanding?.evidence?.lenses?.map((lens) => ({
      id: lens.id,
      title: lens.title,
      recognitionCue: lens.recognitionCue,
      sourceCount: lens.sources.length,
    }))).toEqual([
      {
        id: 'making-sense',
        title: 'Making sense',
        recognitionCue: 'I want to understand this.',
        sourceCount: 4,
      },
      {
        id: 'between-people',
        title: 'Understanding between people',
        recognitionCue: 'I want us to understand each other.',
        sourceCount: 5,
      },
    ]);
  });

  it('keeps the lens evidence sets separate and human-verifiable', () => {
    const lenses = needsBySlug.get('understanding')?.evidence?.lenses ?? [];
    const makingSense = lenses.find((lens) => lens.id === 'making-sense');
    const betweenPeople = lenses.find((lens) => lens.id === 'between-people');

    expect(makingSense?.sources.map((source) => source.url)).toEqual([
      'https://link.springer.com/article/10.3758/s13420-024-00647-y',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC4193662/',
      'https://www.nature.com/articles/s41583-018-0078-0',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC4635443/',
    ]);
    expect(betweenPeople?.sources.map((source) => source.url)).toEqual([
      'https://pubmed.ncbi.nlm.nih.gov/16262930/',
      'https://pubmed.ncbi.nlm.nih.gov/37901066/',
      'https://doi.org/10.1037/a0017455',
      'https://doi.org/10.1111/spc3.12308',
      'https://doi.org/10.1002/ejsp.2614',
    ]);

    const allUrls = lenses.flatMap((lens) => lens.sources.map((source) => source.url));
    expect(new Set(allUrls).size).toBe(allUrls.length);
    expect(allUrls.every((url) => url.startsWith('https://'))).toBe(true);
  });

  it('ships the three approved system strategies with supporting sources', () => {
    const understanding = needsBySlug.get('understanding');
    const approvedStrategySlugs = [
      'turn-gap-into-question',
      'explain-in-your-own-words',
      'reflect-and-check',
    ];

    expect(understanding?.strategies.map((strategy) => strategy.slug)).toEqual(approvedStrategySlugs);

    for (const slug of approvedStrategySlugs) {
      expect(strategiesBySlug.get(slug)?.provenance).toBe('system');
      expect(strategiesBySlug.get(slug)?.evidence?.kind).toBe('scholarly');
      expect(strategiesBySlug.get(slug)?.evidence?.url).toMatch(/^https:\/\//);
      expect(strategiesBySlug.get(slug)?.supportedNeeds).toContainEqual({
        title: 'Understanding',
        slug: 'understanding',
      });
    }
  });

  it('removes only the legacy Understanding associations under review', () => {
    expect(strategiesBySlug.get('inanimate-interview')?.supportedNeeds)
      .not.toContainEqual({ title: 'Understanding', slug: 'understanding' });
    expect(strategiesBySlug.get('nearest-job')?.supportedNeeds)
      .not.toContainEqual({ title: 'Understanding', slug: 'understanding' });

    expect(strategiesBySlug.get('inanimate-interview')?.supportedNeeds.map((need) => need.slug))
      .toEqual(expect.arrayContaining(['self-expression', 'empathy']));
    expect(strategiesBySlug.get('nearest-job')?.supportedNeeds.map((need) => need.slug))
      .toEqual(expect.arrayContaining(['clarity', 'order']));
  });
});
