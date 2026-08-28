import { describe, expect, it } from 'vitest';

import legacyData from './generated/legacyData.json';
import userStrategies from './userStrategies.json';
import { needs, needsBySlug, strategiesBySlug } from './catalog';

const approvedSources = [
  {
    url: 'https://pubmed.ncbi.nlm.nih.gov/7984709/',
    description: 'Schlenker, B. R., Britt, T. W., Pennington, J., Murphy, R., & Doherty, K. (1994). The triangle model of responsibility. Psychological Review, 101(4), 632–652.',
  },
  {
    url: 'https://pubmed.ncbi.nlm.nih.gov/10087938/',
    description: 'Lerner, J. S., & Tetlock, P. E. (1999). Accounting for the effects of accountability. Psychological Bulletin, 125(2), 255–275.',
  },
  {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3272423/',
    description: 'Pickard, H. (2011). Responsibility Without Blame: Empathy and the Effective Treatment of Personality Disorder. Philosophy, Psychiatry, & Psychology, 18(3), 209–223.',
  },
  {
    url: 'https://guilfordjournals.com/doi/10.1521/jscp.2013.32.2.225',
    description: 'Woodyatt, L., & Wenzel, M. (2013). Self-Forgiveness and Restoration of an Offender Following an Interpersonal Transgression. Journal of Social and Clinical Psychology, 32(2), 225–259.',
  },
];

describe('approved Accountability audit package', () => {
  it('ships the approved Evidence copy, sources, and two-card deck', () => {
    const accountability = needsBySlug.get('accountability');

    expect(accountability?.summary).toBe(
      'Accountability concerns being able to recognize our part in what happens and respond to the effects of our actions. People judge responsibility by considering how a person was connected to an outcome, what expectations applied, and how much control they had, and we create forms of answerability in which choices or judgments can be explained or justified. How that answerability is structured matters; accountability does not have one uniformly helpful effect. Responsibility itself does not require blame or self-punishment. Clinical work describes treating people as responsible agents while blame is deliberately avoided, and research on interpersonal transgressions finds that taking responsibility can coexist with self-acceptance and efforts to repair. When this Need is active, we may be wanting responsibility to be something that can be acknowledged and responded to rather than ignored or disowned.',
    );
    expect(accountability?.evidence?.sources.map((source) => ({
      url: source.url,
      description: source.description,
    }))).toEqual(approvedSources);
    expect(accountability?.strategies).toEqual([
      { title: 'Map the responsibility', slug: 'map-the-responsibility' },
      { title: 'Draft a repair', slug: 'draft-a-repair' },
    ]);
  });

  it('restores Accountability at its canonical catalog position without shifting later Needs', () => {
    expect(needs).toHaveLength(legacyData.needs.length + 2);
    expect(needs[19]?.slug).toBe('honesty');
    expect(needs[23]?.slug).toBe('accountability');
    expect(needs.slice(0, 23).filter((need) => need.slug !== 'honesty').map((need) => need.slug)).toEqual(
      legacyData.needs.slice(0, 22).map((need) => need.slug),
    );
    expect(needs.slice(24).map((need) => need.slug)).toEqual(
      legacyData.needs.slice(22).map((need) => need.slug),
    );
  });

  it('gives each approved system strategy its approved human-facing source', () => {
    expect(strategiesBySlug.get('map-the-responsibility')).toMatchObject({
      provenance: 'system',
      evidence: {
        kind: 'scholarly',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7853755/',
      },
    });
    expect(strategiesBySlug.get('draft-a-repair')).toMatchObject({
      provenance: 'system',
      evidence: {
        kind: 'scholarly',
        url: 'https://www.tandfonline.com/doi/full/10.1080/15298861003669565',
      },
    });
  });

  it('physically retires superseded Accountability legacy ownership while preserving reverse references', () => {
    expect(legacyData.needs.some((need) => need.slug === 'accountability')).toBe(false);

    const reverseReferences = [
      ...legacyData.feelings.flatMap((feeling) => feeling.needs ?? []),
      ...legacyData.fauxFeelings.flatMap((feeling) => feeling.needs ?? []),
    ].filter((need) => need.slug === 'accountability');

    expect(reverseReferences.length).toBeGreaterThan(0);
  });

  it('does not invent or alter a protected repository-resident Accountability strategy', () => {
    const protectedAccountability = userStrategies.filter((strategy) =>
      strategy.needs.some((need) => need.slug === 'accountability'),
    );
    expect(protectedAccountability).toEqual([]);
  });

  it('keeps approved Accountability URLs clean and human-facing', () => {
    const accountability = needsBySlug.get('accountability');
    const urls = [
      ...(accountability?.evidence?.sources.map((source) => source.url) ?? []),
      ...(accountability?.strategies
        .map((reference) => strategiesBySlug.get(reference.slug)?.evidence?.url)
        .filter((url): url is string => Boolean(url)) ?? []),
    ];

    for (const url of urls) {
      expect(url).toMatch(/^https:\/\//);
      expect(url).not.toMatch(/utm_|gclid|fbclid|mc_cid|mc_eid|chatgpt|openai/i);
    }
  });
});
