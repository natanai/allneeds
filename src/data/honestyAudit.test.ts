import { describe, expect, it } from 'vitest';

import legacyData from './generated/legacyData.json';
import { needs, needsBySlug, strategiesBySlug } from './catalog';

const approvedSourceUrls = [
  'https://onlinelibrary.wiley.com/doi/10.3982/ECTA14673',
  'https://www.annualreviews.org/content/journals/10.1146/annurev-psych-081920-042106',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC8487738/',
  'https://pubmed.ncbi.nlm.nih.gov/31916837/',
  'https://journals.aom.org/doi/abs/10.5465/annals.2021.0209',
  'https://link.springer.com/article/10.1007/s10790-024-09990-9',
  'https://pubmed.ncbi.nlm.nih.gov/27936834/',
];

describe('approved Honesty audit package', () => {
  it('ships the approved one-paragraph Evidence copy, sources, and three-card deck', () => {
    const honesty = needsBySlug.get('honesty');

    expect(honesty?.summary).toBe(
      'Honesty concerns a motivation to keep what we communicate aligned with what we actually take to be true, while leaving room to say when we are unsure or when our understanding changes. People often act on this concern even when lying could benefit them, and experimental work suggests that both a preference for honesty itself and a preference for being seen as honest can motivate truth-telling. Evolutionary and cultural-evolutionary accounts of human cooperation have examined reputation and reliable information-sharing as part of how cooperation is sustained, and experiments show that honest reputations can shape trust judgments. Research on honest behavior also distinguishes seeking accurate information, expressing what one believes, and helping others form an accurate understanding. Philosophical and experimental work helps clarify why honesty is not identical to factual correctness: sincere statements can be mistaken, while factually true statements can still be used to mislead. When honesty feels especially important, the motivation may be drawing attention to whether the information moving between people is dependable enough to act on and whether what we are expressing still represents what we actually believe.',
    );
    expect(honesty?.evidence?.sources.map((source) => source.url)).toEqual(approvedSourceUrls);
    expect(honesty?.strategies).toEqual([
      { title: 'Sort what you know', slug: 'sort-what-you-know' },
      { title: 'Practice saying what you mean', slug: 'practice-saying-what-you-mean' },
      { title: 'Rehearse what you wish you had said', slug: 'rehearse-what-you-wish-you-had-said' },
    ]);
  });

  it('restores Honesty at its canonical catalog position without shifting later Needs', () => {
    expect(needs).toHaveLength(legacyData.needs.length + 1);
    expect(needs[19]?.slug).toBe('honesty');
    expect(needs.slice(0, 19).map((need) => need.slug)).toEqual(
      legacyData.needs.slice(0, 19).map((need) => need.slug),
    );
    expect(needs.slice(20).map((need) => need.slug)).toEqual(
      legacyData.needs.slice(19).map((need) => need.slug),
    );
  });

  it('gives each approved system strategy its approved human-facing source', () => {
    expect(strategiesBySlug.get('sort-what-you-know')).toMatchObject({
      provenance: 'system',
      evidence: {
        kind: 'clinical-guidance',
        url: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/',
      },
    });
    expect(strategiesBySlug.get('practice-saying-what-you-mean')).toMatchObject({
      provenance: 'system',
      evidence: {
        kind: 'scholarly',
        url: 'https://onlinelibrary.wiley.com/doi/10.1111/cpsp.12216',
      },
    });
    expect(strategiesBySlug.get('rehearse-what-you-wish-you-had-said')).toMatchObject({
      provenance: 'system',
      evidence: {
        kind: 'scholarly',
        url: 'https://pubmed.ncbi.nlm.nih.gov/512017/',
      },
    });
  });

  it('physically retires superseded Honesty legacy ownership and global-discard strategies', () => {
    expect(legacyData.needs.some((need) => need.slug === 'honesty')).toBe(false);
    for (const slug of ['write-three-sentences', 'observation-only', 'self-check-scale']) {
      expect(legacyData.strategies.some((strategy) => strategy.slug === slug)).toBe(false);
      expect(strategiesBySlug.has(slug)).toBe(false);
    }
    expect(strategiesBySlug.get('name-a-want-a-don-t')?.supportedNeeds.map((need) => need.slug)).toEqual([
      'autonomy',
    ]);
  });

  it('keeps approved Honesty URLs clean and human-facing', () => {
    const honesty = needsBySlug.get('honesty');
    const urls = [
      ...(honesty?.evidence?.sources.map((source) => source.url) ?? []),
      ...(honesty?.strategies
        .map((reference) => strategiesBySlug.get(reference.slug)?.evidence?.url)
        .filter((url): url is string => Boolean(url)) ?? []),
    ];

    for (const url of urls) {
      expect(url).toMatch(/^https:\/\//);
      expect(url).not.toMatch(/utm_|gclid|fbclid|chatgpt|openai/i);
    }
  });
});
