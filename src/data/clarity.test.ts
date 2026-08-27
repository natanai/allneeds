import { describe, expect, it } from 'vitest';

import { needsBySlug, strategiesBySlug } from './catalog';

describe('approved Clarity audit', () => {
  it('ships the approved umbrella, lenses, citations, and final two-card deck', () => {
    const clarity = needsBySlug.get('clarity');

    expect(clarity?.summary).toBe(
      'Our value for clarity may motivate us to make something easier to distinguish or work with. This can involve making outside information more explicit or getting clearer about what matters to us. The amount of detail that feels sufficient can differ between people and situations. Clarity can help us see what is being claimed or what remains uncertain without deciding whether a claim is true or an uncertainty is resolved.',
    );

    expect(clarity?.evidence?.lenses?.map((lens) => ({
      id: lens.id,
      title: lens.title,
      recognitionCue: lens.recognitionCue,
      summary: lens.summary,
      urls: lens.sources.map((source) => source.url),
    }))).toEqual([
      {
        id: 'making-things-explicit',
        title: 'Making things explicit',
        recognitionCue: 'I want this to be clearer.',
        summary: 'When something feels ambiguous, we may seek clarity by making the relevant information easier to work with. We might bring related material together, state an expectation more precisely, or identify what is still uncertain. Making a statement easier to perceive does not tell us whether it is true. Making uncertainty explicit does not make it disappear.',
        urls: [
          'https://doi.org/10.1111/j.2044-8279.1992.tb01017.x',
          'https://doi.org/10.1177/014920630002600104',
          'https://pubmed.ncbi.nlm.nih.gov/10487787/',
          'https://pmc.ncbi.nlm.nih.gov/articles/PMC6549952/',
        ],
      },
      {
        id: 'getting-clear-within-yourself',
        title: 'Getting clear within yourself',
        recognitionCue: 'I want to get clear on what I think or what matters to me.',
        summary: 'Sometimes clarity concerns our own beliefs or values rather than outside information. We may want to put what matters into words, notice when important values conflict, or recognize that we have not decided yet.',
        urls: [
          'https://doi.org/10.1037/0022-3514.70.1.141',
          'https://pmc.ncbi.nlm.nih.gov/articles/PMC8482297/',
        ],
      },
    ]);

    expect(clarity?.strategies).toEqual([
      { title: 'Separate what happened from what you think it means', slug: 'separate-event-from-meaning' },
      { title: 'Name what matters here', slug: 'name-what-matters-here' },
    ]);

    expect(strategiesBySlug.get('separate-event-from-meaning')).toMatchObject({
      provenance: 'system',
      evidence: {
        kind: 'clinical-guidance',
        url: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/',
      },
    });
    expect(strategiesBySlug.get('name-what-matters-here')).toMatchObject({
      provenance: 'system',
      evidence: {
        kind: 'scholarly',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8482297/',
      },
    });
    expect(strategiesBySlug.has('bring-the-pieces-together')).toBe(false);
  });

  it('globally discards the seven Clarity legacy strategies approved for removal', () => {
    [
      'alternate-nostril-breaths',
      'hold-something-cool',
      'name-three-sounds',
      'name-three-needs-alive',
      'circle-the-priority',
      'name-need-link',
      'trace-your-hand',
    ].forEach((slug) => expect(strategiesBySlug.has(slug)).toBe(false));
  });

  it('removes only the Clarity association from shared legacy strategies and preserves their remaining needs', () => {
    const expectedRemainingNeeds: Record<string, string[]> = {
      '5-4-3-2-1-check': ['safety'],
      'write-three-sentences': ['honesty'],
      'observation-only': ['honesty'],
      'micro-request-to-self': ['autonomy'],
      'ask-for-channel-shift': ['autonomy', 'consideration'],
      'calendar-one-thing': ['order', 'predictability'],
      'self-check-scale': ['honesty'],
      'name-what-s-within-control': ['autonomy'],
      'value-compass-card': ['integrity'],
      'name-a-want-a-don-t': ['autonomy', 'honesty'],
      'window-quarter': ['appreciation', 'beauty', 'calm'],
      'nearest-job': ['order'],
    };

    Object.entries(expectedRemainingNeeds).forEach(([slug, expectedNeeds]) => {
      const strategy = strategiesBySlug.get(slug);
      expect(strategy, `${slug} should remain available outside Clarity`).toBeDefined();
      expect(strategy?.supportedNeeds.map((need) => need.slug).sort()).toEqual([...expectedNeeds].sort());
    });
  });
});
