from __future__ import annotations

import json
from pathlib import Path

ROOT = Path('.')
EDITORIAL_PATH = ROOT / 'src/data/editorialCatalog.json'
LEGACY_PATH = ROOT / 'src/data/generated/legacyData.json'
VITE_PATH = ROOT / 'vite.config.ts'
CLARITY_TEST_PATH = ROOT / 'src/data/clarity.test.ts'
HONESTY_TEST_PATH = ROOT / 'src/data/honestyAudit.test.ts'
AUDIT_PATH = ROOT / 'docs/honesty-content-audit.md'
REVIEW_PATH = ROOT / 'docs/content-evidence-review.md'


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise AssertionError(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)


legacy = json.loads(LEGACY_PATH.read_text(encoding='utf-8'))
editorial = json.loads(EDITORIAL_PATH.read_text(encoding='utf-8'))

honesty_index = next(
    (index for index, need in enumerate(legacy['needs']) if need.get('slug') == 'honesty'),
    None,
)
if honesty_index is None:
    raise AssertionError('Expected legacy Honesty need before migration')

honesty_summary = (
    'Honesty concerns a motivation to keep what we communicate aligned with what we actually take to be true, '
    'while leaving room to say when we are unsure or when our understanding changes. People often act on this '
    'concern even when lying could benefit them, and experimental work suggests that both a preference for honesty '
    'itself and a preference for being seen as honest can motivate truth-telling. Evolutionary and cultural-evolutionary '
    'accounts of human cooperation have examined reputation and reliable information-sharing as part of how cooperation '
    'is sustained, and experiments show that honest reputations can shape trust judgments. Research on honest behavior '
    'also distinguishes seeking accurate information, expressing what one believes, and helping others form an accurate '
    'understanding. Philosophical and experimental work helps clarify why honesty is not identical to factual correctness: '
    'sincere statements can be mistaken, while factually true statements can still be used to mislead. When honesty feels '
    'especially important, the motivation may be drawing attention to whether the information moving between people is '
    'dependable enough to act on and whether what we are expressing still represents what we actually believe.'
)

honesty_narrative = '\n\n'.join([
    (
        'Abeler, Nosenzo, and Raymond combined data from 90 experimental studies in economics, psychology, and sociology '
        'in which people could benefit materially by misreporting information only they knew. People lied less than would '
        'be expected if material gain were their only concern. The researchers then conducted additional experiments to '
        'compare possible explanations. Their results pointed especially to a preference for being honest and a preference '
        'for being seen as honest as motivations for truth-telling.'
    ),
    (
        "Henrich and Muthukrishna review evolutionary and cultural-evolutionary research on humans' unusually extensive "
        'cooperation. Their account includes reputation and signalling among the processes scholars have proposed for '
        'sustaining cooperation beyond close family relationships. Számadó and colleagues focus more closely on reputation '
        "systems and honest signalling. They describe evidence that sharing information about other people's behavior can "
        'promote cooperation, while examining how such information can remain reliable enough to be useful.'
    ),
    (
        "Bellucci and Park studied how a person's history of honesty affected trust decisions across three experiments. "
        'Participants preferred to trust people who had consistently shared truthful information. An established reputation '
        'for honesty could continue influencing judgments even after later behavior became less trustworthy.'
    ),
    (
        'Cooper and colleagues systematically reviewed 169 empirical articles on honest behavior. Their framework covers '
        'seeking accurate information, expressing what one believes, and communicating in ways that help other people '
        'understand the truth. The review also considers updating beliefs when new information becomes available and forms '
        'of communication that can create a misleading understanding without an outright false statement.'
    ),
    (
        'Dougherty examines the relationship between honesty and factual truth. Someone can sincerely express something '
        'they believe and later turn out to be wrong. A person can also make a factually correct statement while intending '
        'to deceive. Being mistaken does not by itself make someone dishonest.'
    ),
    (
        'Rogers and colleagues studied paltering, the use of factually true statements to create a misleading impression. '
        'Across two pilot studies and six experiments, people who discovered they had been misled through paltering reacted '
        'negatively to it and judged the communicator more harshly. Their experiments show why checking only whether '
        'individual statements are factually true does not settle whether a communication is honest.'
    ),
])

need_sources = [
    {
        'url': 'https://onlinelibrary.wiley.com/doi/10.3982/ECTA14673',
        'description': 'Abeler, Nosenzo, and Raymond (2019), Preferences for Truth-Telling',
        'kind': 'scholarly',
    },
    {
        'url': 'https://www.annualreviews.org/content/journals/10.1146/annurev-psych-081920-042106',
        'description': 'Henrich and Muthukrishna (2021), The Origins and Psychology of Human Cooperation',
        'kind': 'scholarly',
    },
    {
        'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8487738/',
        'description': 'Számadó et al. (2021), The language of cooperation: reputation and honest signalling',
        'kind': 'scholarly',
    },
    {
        'url': 'https://pubmed.ncbi.nlm.nih.gov/31916837/',
        'description': 'Bellucci and Park (2020), Honesty biases trustworthiness impressions',
        'kind': 'scholarly',
    },
    {
        'url': 'https://journals.aom.org/doi/abs/10.5465/annals.2021.0209',
        'description': 'Cooper et al. (2023), Honest Behavior: Truth-Seeking, Belief-Speaking, and Fostering Understanding of the Truth in Others',
        'kind': 'scholarly',
    },
    {
        'url': 'https://link.springer.com/article/10.1007/s10790-024-09990-9',
        'description': 'Dougherty (2024), Honesty and the Truth: Against Subjectivism About Honesty',
        'kind': 'scholarly',
    },
    {
        'url': 'https://pubmed.ncbi.nlm.nih.gov/27936834/',
        'description': 'Rogers et al. (2017), Artful paltering: The risks and rewards of using truthful statements to mislead others',
        'kind': 'scholarly',
    },
]

strategy_refs = [
    {'title': 'Sort what you know', 'slug': 'sort-what-you-know'},
    {'title': 'Practice saying what you mean', 'slug': 'practice-saying-what-you-mean'},
    {'title': 'Rehearse what you wish you had said', 'slug': 'rehearse-what-you-wish-you-had-said'},
]

editorial['needs']['honesty'] = {
    'title': 'Honesty',
    'category': 'Authenticity',
    'catalogOrder': honesty_index,
    'feelings': [
        {'title': 'Angry', 'slug': 'angry'},
        {'title': 'Hurt', 'slug': 'hurt'},
        {'title': 'Disappointment', 'slug': 'disappointment'},
        {'title': 'Enraged', 'slug': 'enraged'},
        {'title': 'Resentful', 'slug': 'resentful'},
        {'title': 'Sad', 'slug': 'sad'},
        {'title': 'Frustrated', 'slug': 'frustrated'},
        {'title': 'Embarrassed', 'slug': 'embarrassed'},
    ],
    'fauxFeelings': [
        {'title': 'Betrayed', 'slug': 'betrayed'},
        {'title': 'Cheated', 'slug': 'cheated'},
        {'title': 'Distrusted', 'slug': 'distrusted'},
        {'title': 'Tricked', 'slug': 'tricked'},
    ],
    'summary': honesty_summary,
    'narrative': honesty_narrative,
    'sources': need_sources,
    'strategies': strategy_refs,
}

approved_strategy_slugs = {reference['slug'] for reference in strategy_refs}
editorial['strategies'] = [
    strategy for strategy in editorial.get('strategies', [])
    if strategy.get('slug') not in approved_strategy_slugs
]
editorial['strategies'].extend([
    {
        'title': 'Sort what you know',
        'slug': 'sort-what-you-know',
        'description': (
            'Write down what happened. Then write what you think it means. Look at what evidence you actually have for '
            'that interpretation and what you still do not know.\n\n'
            'For example: “They ended the conversation when I asked.” “I think they were avoiding the question.” '
            '“I don\'t actually know why they ended it.”\n\n'
            'If you do not know yet, you can leave it at “I don\'t know yet.”'
        ),
        'needs': [{'title': 'Honesty', 'slug': 'honesty'}],
        'provenance': 'system',
        'evidence': {
            'url': 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/',
            'description': 'NHS Every Mind Matters, Thought record',
            'kind': 'clinical-guidance',
        },
    },
    {
        'title': 'Practice saying what you mean',
        'slug': 'practice-saying-what-you-mean',
        'description': (
            'Put what you genuinely want to communicate into one clear, direct sentence, then practice saying it privately. '
            'You do not have to contact anyone.\n\n'
            'For example: “I said I was fine, but I was actually hurt.” Or: “I don\'t feel like I know the whole story, '
            'and honesty about what happened matters to me.”'
        ),
        'needs': [{'title': 'Honesty', 'slug': 'honesty'}],
        'provenance': 'system',
        'evidence': {
            'url': 'https://onlinelibrary.wiley.com/doi/10.1111/cpsp.12216',
            'description': 'Speed, Goldstein, and Goldfried (2018), Assertiveness Training: A Forgotten Evidence-Based Treatment',
            'kind': 'scholarly',
        },
    },
    {
        'title': 'Rehearse what you wish you had said',
        'slug': 'rehearse-what-you-wish-you-had-said',
        'description': (
            'Think back to something you said that did not represent what you really meant. Practice a version that does. '
            'This is rehearsal, not a commitment to reopen the conversation.\n\n'
            'For example: “I said I didn\'t care. What I meant was that I cared and didn\'t feel able to keep talking.” '
            'Or: “I said I was sure, but I\'m actually uncertain.”'
        ),
        'needs': [{'title': 'Honesty', 'slug': 'honesty'}],
        'provenance': 'system',
        'evidence': {
            'url': 'https://pubmed.ncbi.nlm.nih.gov/512017/',
            'description': 'Zielinski and Williams (1979), Covert modeling vs. Behavior rehearsal in the training and generalization of assertive behaviors: a crossover design',
            'kind': 'scholarly',
        },
    },
])

removals = editorial.get('strategyNeedRemovals', {})
for slug in [
    'write-three-sentences',
    'observation-only',
    'self-check-scale',
    'name-a-want-a-don-t',
]:
    removals.pop(slug, None)
editorial['strategyNeedRemovals'] = removals

# Complete editorial ownership exists before superseded legacy ownership is retired.
legacy['needs'] = [need for need in legacy['needs'] if need.get('slug') != 'honesty']

globally_retired = {'write-three-sentences', 'observation-only', 'self-check-scale'}
legacy['strategies'] = [
    strategy for strategy in legacy['strategies']
    if strategy.get('slug') not in globally_retired
]

for strategy in legacy['strategies']:
    if strategy.get('slug') == 'name-a-want-a-don-t':
        strategy['needs'] = [{'title': 'Autonomy', 'slug': 'autonomy'}]

for need in legacy['needs']:
    refs = need.get('strategies')
    if not isinstance(refs, list):
        continue
    refs = [ref for ref in refs if ref.get('slug') not in globally_retired]
    if need.get('slug') != 'autonomy':
        refs = [ref for ref in refs if ref.get('slug') != 'name-a-want-a-don-t']
    need['strategies'] = refs

write_json(EDITORIAL_PATH, editorial)
write_json(LEGACY_PATH, legacy)

vite = VITE_PATH.read_text(encoding='utf-8')
vite = replace_once(
    vite,
    '''type EditorialNeed = {
  summary: string;
  narrative: string;
  sources: EvidenceSource[];
  strategies: EntityRef[];
  lenses?: EvidenceLens[];
};''',
    '''type EditorialNeed = {
  title?: string;
  category?: string;
  catalogOrder?: number;
  feelings?: EntityRef[];
  fauxFeelings?: EntityRef[];
  summary: string;
  narrative: string;
  sources: EvidenceSource[];
  strategies: EntityRef[];
  lenses?: EvidenceLens[];
};
type CanonicalEditorialNeed = EditorialNeed & {
  title: string;
  catalogOrder: number;
  feelings: EntityRef[];
  fauxFeelings: EntityRef[];
};''',
    'EditorialNeed type',
)

vite = replace_once(
    vite,
    'function runtimeCatalogSource() {\n',
    '''function editorialNeedOwnsEntity(need: EditorialNeed): need is CanonicalEditorialNeed {
  return typeof need.title === 'string'
    && typeof need.catalogOrder === 'number'
    && Array.isArray(need.feelings)
    && Array.isArray(need.fauxFeelings);
}

function runtimeCatalogSource() {
''',
    'editorial ownership guard',
)

old_needs_block = '''  const needs = legacy.needs.map((need) => {
    const override = editorial.needs[need.slug];
    const strategies = [...(override?.strategies ?? need.strategies ?? [])]
      .filter((reference) => strategyAllowedForNeed(reference.slug, need.slug));
    (addedStrategyRefsByNeed.get(need.slug) ?? []).forEach((reference) => {
      if (strategyAllowedForNeed(reference.slug, need.slug)
        && !strategies.some((candidate) => candidate.slug === reference.slug)) {
        strategies.push(reference);
      }
    });

    return {
      slug: need.slug,
      title: need.title,
      category: need.category,
      summary: override?.summary ?? need.description ?? need.originalClaim ?? '',
      feelings: need.feelings ?? [],
      fauxFeelings: need.fauxFeelings ?? [],
      strategies,
      evidence: {
        claimSummary: override?.summary ?? need.originalClaim,
        narrative: override?.narrative ?? need.rewrittenClaim,
        sources: override?.sources ?? need.supportingSources ?? [],
        ...(override?.lenses?.length ? { lenses: override.lenses } : {}),
      },
    };
  });
'''

new_needs_block = '''  const canonicalEditorialNeeds = Object.entries(editorial.needs)
    .filter(([, need]) => editorialNeedOwnsEntity(need))
    .map(([slug, need]) => [slug, need] as [string, CanonicalEditorialNeed]);
  const canonicalEditorialNeedSlugs = new Set(canonicalEditorialNeeds.map(([slug]) => slug));
  const strategyReferencesForNeed = (needSlug: string, baseReferences: EntityRef[]) => {
    const strategies = [...baseReferences]
      .filter((reference) => strategyAllowedForNeed(reference.slug, needSlug));
    (addedStrategyRefsByNeed.get(needSlug) ?? []).forEach((reference) => {
      if (strategyAllowedForNeed(reference.slug, needSlug)
        && !strategies.some((candidate) => candidate.slug === reference.slug)) {
        strategies.push(reference);
      }
    });
    return strategies;
  };

  const legacyNeeds = legacy.needs
    .map((need, catalogOrder) => ({ need, catalogOrder }))
    .filter(({ need }) => !canonicalEditorialNeedSlugs.has(need.slug))
    .map(({ need, catalogOrder }) => {
      const override = editorial.needs[need.slug];
      return {
        catalogOrder,
        value: {
          slug: need.slug,
          title: need.title,
          category: need.category,
          summary: override?.summary ?? need.description ?? need.originalClaim ?? '',
          feelings: need.feelings ?? [],
          fauxFeelings: need.fauxFeelings ?? [],
          strategies: strategyReferencesForNeed(
            need.slug,
            override?.strategies ?? need.strategies ?? [],
          ),
          evidence: {
            claimSummary: override?.summary ?? need.originalClaim,
            narrative: override?.narrative ?? need.rewrittenClaim,
            sources: override?.sources ?? need.supportingSources ?? [],
            ...(override?.lenses?.length ? { lenses: override.lenses } : {}),
          },
        },
      };
    });

  const editorialNeeds = canonicalEditorialNeeds.map(([slug, need]) => ({
    catalogOrder: need.catalogOrder,
    value: {
      slug,
      title: need.title,
      category: need.category,
      summary: need.summary,
      feelings: need.feelings,
      fauxFeelings: need.fauxFeelings,
      strategies: strategyReferencesForNeed(slug, need.strategies),
      evidence: {
        claimSummary: need.summary,
        narrative: need.narrative,
        sources: need.sources,
        ...(need.lenses?.length ? { lenses: need.lenses } : {}),
      },
    },
  }));

  const needs = [...legacyNeeds, ...editorialNeeds]
    .sort((a, b) => a.catalogOrder - b.catalogOrder)
    .map(({ value }) => value);
'''
vite = replace_once(vite, old_needs_block, new_needs_block, 'Need compiler')
VITE_PATH.write_text(vite, encoding='utf-8')

clarity_test = CLARITY_TEST_PATH.read_text(encoding='utf-8')
for obsolete in [
    "      'write-three-sentences': ['honesty'],\n",
    "      'observation-only': ['honesty'],\n",
    "      'self-check-scale': ['honesty'],\n",
]:
    if obsolete not in clarity_test:
        raise AssertionError(f'Missing obsolete Clarity assertion: {obsolete.strip()}')
    clarity_test = clarity_test.replace(obsolete, '', 1)
clarity_test = replace_once(
    clarity_test,
    "      'name-a-want-a-don-t': ['autonomy', 'honesty'],\n",
    "      'name-a-want-a-don-t': ['autonomy'],\n",
    'Clarity name-a-want association',
)
CLARITY_TEST_PATH.write_text(clarity_test, encoding='utf-8')

HONESTY_TEST_PATH.write_text('''import { describe, expect, it } from 'vitest';

import legacyData from './generated/legacyData.json';
import { needsBySlug, strategiesBySlug } from './catalog';

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
''', encoding='utf-8')

AUDIT_PATH.write_text('''# Honesty content audit

> Status: content approved and implemented 2026-08-27. Honesty is not fully audited until its redesigned magnet is separately approved and live.

This document is the authoritative current audit record for the Honesty Need. It supersedes the imported Honesty copy and strategy associations in the historical legacy snapshot.

## Approved short Evidence copy

> Honesty concerns a motivation to keep what we communicate aligned with what we actually take to be true, while leaving room to say when we are unsure or when our understanding changes. People often act on this concern even when lying could benefit them, and experimental work suggests that both a preference for honesty itself and a preference for being seen as honest can motivate truth-telling. Evolutionary and cultural-evolutionary accounts of human cooperation have examined reputation and reliable information-sharing as part of how cooperation is sustained, and experiments show that honest reputations can shape trust judgments. Research on honest behavior also distinguishes seeking accurate information, expressing what one believes, and helping others form an accurate understanding. Philosophical and experimental work helps clarify why honesty is not identical to factual correctness: sincere statements can be mistaken, while factually true statements can still be used to mislead. When honesty feels especially important, the motivation may be drawing attention to whether the information moving between people is dependable enough to act on and whether what we are expressing still represents what we actually believe.

## Approved Details

Abeler, Nosenzo, and Raymond combined data from 90 experimental studies in economics, psychology, and sociology in which people could benefit materially by misreporting information only they knew. People lied less than would be expected if material gain were their only concern. The researchers then conducted additional experiments to compare possible explanations. Their results pointed especially to a preference for being honest and a preference for being seen as honest as motivations for truth-telling.

Henrich and Muthukrishna review evolutionary and cultural-evolutionary research on humans' unusually extensive cooperation. Their account includes reputation and signalling among the processes scholars have proposed for sustaining cooperation beyond close family relationships. Számadó and colleagues focus more closely on reputation systems and honest signalling. They describe evidence that sharing information about other people's behavior can promote cooperation, while examining how such information can remain reliable enough to be useful.

Bellucci and Park studied how a person's history of honesty affected trust decisions across three experiments. Participants preferred to trust people who had consistently shared truthful information. An established reputation for honesty could continue influencing judgments even after later behavior became less trustworthy.

Cooper and colleagues systematically reviewed 169 empirical articles on honest behavior. Their framework covers seeking accurate information, expressing what one believes, and communicating in ways that help other people understand the truth. The review also considers updating beliefs when new information becomes available and forms of communication that can create a misleading understanding without an outright false statement.

Dougherty examines the relationship between honesty and factual truth. Someone can sincerely express something they believe and later turn out to be wrong. A person can also make a factually correct statement while intending to deceive. Being mistaken does not by itself make someone dishonest.

Rogers and colleagues studied paltering, the use of factually true statements to create a misleading impression. Across two pilot studies and six experiments, people who discovered they had been misled through paltering reacted negatively to it and judged the communicator more harshly. Their experiments show why checking only whether individual statements are factually true does not settle whether a communication is honest.

## Approved Need-level sources

1. Abeler, J., Nosenzo, D., & Raymond, C. (2019). *Preferences for Truth-Telling.* Econometrica, 87(4), 1115–1153.  
   https://onlinelibrary.wiley.com/doi/10.3982/ECTA14673
2. Henrich, J., & Muthukrishna, M. (2021). *The Origins and Psychology of Human Cooperation.* Annual Review of Psychology, 72, 207–240.  
   https://www.annualreviews.org/content/journals/10.1146/annurev-psych-081920-042106
3. Számadó, S., Balliet, D., Giardini, F., Power, E. A., & Takács, K. (2021). *The language of cooperation: reputation and honest signalling.* Philosophical Transactions of the Royal Society B, 376(1838), 20200286.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC8487738/
4. Bellucci, G., & Park, S. Q. (2020). *Honesty biases trustworthiness impressions.* Journal of Experimental Psychology: General, 149(8), 1567–1586.  
   https://pubmed.ncbi.nlm.nih.gov/31916837/
5. Cooper, B., Cohen, T. R., Huppert, E., Levine, E. E., & Fleeson, W. (2023). *Honest Behavior: Truth-Seeking, Belief-Speaking, and Fostering Understanding of the Truth in Others.* Academy of Management Annals, 17(2), 655–683.  
   https://journals.aom.org/doi/abs/10.5465/annals.2021.0209
6. Dougherty, M. (2024). *Honesty and the Truth: Against Subjectivism About Honesty.* The Journal of Value Inquiry.  
   https://link.springer.com/article/10.1007/s10790-024-09990-9
7. Rogers, T., Zeckhauser, R., Gino, F., Norton, M. I., & Schweitzer, M. E. (2017). *Artful paltering: The risks and rewards of using truthful statements to mislead others.* Journal of Personality and Social Psychology, 112(3), 456–473.  
   https://pubmed.ncbi.nlm.nih.gov/27936834/

## Internal source roles and limits

- **Abeler, Nosenzo, and Raymond:** Aggregates 90 experimental studies and adds new experiments showing that material payoff alone does not explain truth-telling. Preference for being honest and for being seen as honest are the central supported motivations. It does not establish Honesty as a formally defined basic psychological need.
- **Henrich and Muthukrishna:** Reviews evolutionary and cultural-evolutionary accounts of large-scale human cooperation. Reputation and signalling are proposed mechanisms in that broader account. It does not establish a discrete evolved Honesty module.
- **Számadó et al.:** Provides the closer bridge between reputation systems, information-sharing, honest signalling, and cooperation. Evolutionary claims remain accounts of how such systems may emerge and remain reliable, not proof of an innate Honesty essence.
- **Bellucci and Park:** Three experiments show that an honest reputation can shape trust judgments, including later updating. This is evidence about reputation and trust decisions, not a claim that honesty always improves relationships or well-being.
- **Cooper et al.:** Systematic review of 169 empirical articles. Its framework covers truth-seeking, belief-speaking, and fostering accurate understanding. The framework informs conceptual clarity but is not treated as a formal definition of the site's Need.
- **Dougherty:** Philosophical analysis clarifying that ordinary honest assertions can be false and factually true assertions can be dishonest. The author still argues that honesty is oriented toward truth, so the source must not be represented as separating honesty from truth altogether.
- **Rogers et al.:** Experimental work on paltering shows that factually true statements can be used to create misleading impressions. It supports the conceptual distinction in the Need copy, not a self-help strategy.

## Approved static strategy deck

### Sort what you know

Write down what happened. Then write what you think it means. Look at what evidence you actually have for that interpretation and what you still do not know.

For example: “They ended the conversation when I asked.” “I think they were avoiding the question.” “I don't actually know why they ended it.”

If you do not know yet, you can leave it at “I don't know yet.”

Supporting source: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/

Internal evidence classification: **established clinical practice / clinical guidance**. The NHS thought-record exercise directly teaches recording a situation and examining the evidence for one's interpretation. The Honesty card narrows that practice to distinguishing what is known, interpreted, and still unknown.

### Practice saying what you mean

Put what you genuinely want to communicate into one clear, direct sentence, then practice saying it privately. You do not have to contact anyone.

For example: “I said I was fine, but I was actually hurt.” Or: “I don't feel like I know the whole story, and honesty about what happened matters to me.”

Supporting source: https://onlinelibrary.wiley.com/doi/10.1111/cpsp.12216

Internal evidence classification: **established evidence-based clinical practice**. Speed, Goldstein, and Goldfried review assertiveness training as an evidence-based treatment approach centered on more direct expression. The private-practice wording preserves choice and does not require disclosure or contact.

### Rehearse what you wish you had said

Think back to something you said that did not represent what you really meant. Practice a version that does. This is rehearsal, not a commitment to reopen the conversation.

For example: “I said I didn't care. What I meant was that I cared and didn't feel able to keep talking.” Or: “I said I was sure, but I'm actually uncertain.”

Supporting source: https://pubmed.ncbi.nlm.nih.gov/512017/

Internal evidence classification: **direct intervention evidence**. Zielinski and Williams used a randomized crossover design with 24 underassertive community participants. Behavior rehearsal improved assertive skills across multiple measures and generalized to some situations that were not directly trained. The card uses rehearsal without claiming that the exact sentence prompt was separately tested.

## Legacy strategy disposition

- `write-three-sentences`: Honesty association rejected. Clarity had already rejected it. No surviving Need association remains, so the strategy is globally discarded and physically retired.
- `observation-only`: Honesty association rejected. Clarity had already rejected it. No surviving Need association remains, so the strategy is globally discarded and physically retired.
- `self-check-scale`: Honesty association rejected. Clarity had already rejected it. No surviving Need association remains, so the strategy is globally discarded and physically retired.
- `name-a-want-a-don-t`: Honesty association removed. Clarity had already removed its association. The strategy remains available for Autonomy and is not globally deleted.

No repository-resident protected user strategy is statically associated with Honesty.

## Canonical ownership and implementation

Honesty now has complete canonical ownership in `src/data/editorialCatalog.json`, including title, category, Feeling and Faux Feeling relationships, approved Evidence content, sources, and static system strategies.

The deterministic runtime catalog compiler recognizes a complete editorial Need as the entity owner. Legacy remains a migration source only for entities that have not yet received complete canonical ownership. The superseded Honesty Need record is physically removed from `src/data/generated/legacyData.json`.

Reverse Honesty references that remain inside still-legacy-owned Feeling or Faux Feeling entities are cross-entity relationships used by those entity families. They are not a second source of Honesty Need content and remain until those entity families receive their own canonical migration.

No runtime repair layer, post-processor, injected content, or duplicate Honesty source of truth is introduced.

## Visual audit

Content approval does not approve the Honesty magnet. Honesty remains pending visual review in `/design-lab/need-magnets`; it becomes fully audited only after an approved redesigned magnet is live.
''', encoding='utf-8')

review = REVIEW_PATH.read_text(encoding='utf-8')
pointer = '''\n\n## Honesty\n\n**Status:** content audited and implemented 2026-08-27; redesigned magnet review pending. The authoritative current content record is `docs/honesty-content-audit.md`.\n'''
if 'The authoritative current content record is `docs/honesty-content-audit.md`.' not in review:
    REVIEW_PATH.write_text(review.rstrip() + pointer, encoding='utf-8')

# Migration invariants before repository checks.
editorial_after = json.loads(EDITORIAL_PATH.read_text(encoding='utf-8'))
legacy_after = json.loads(LEGACY_PATH.read_text(encoding='utf-8'))
honesty = editorial_after['needs']['honesty']
assert honesty['title'] == 'Honesty'
assert honesty['catalogOrder'] == honesty_index
assert honesty['strategies'] == strategy_refs
assert not any(need.get('slug') == 'honesty' for need in legacy_after['needs'])
for slug in globally_retired:
    assert not any(strategy.get('slug') == slug for strategy in legacy_after['strategies'])
    assert not any(
        ref.get('slug') == slug
        for need in legacy_after['needs']
        for ref in need.get('strategies', [])
    )
name_a = next(strategy for strategy in legacy_after['strategies'] if strategy.get('slug') == 'name-a-want-a-don-t')
assert name_a.get('needs') == [{'title': 'Autonomy', 'slug': 'autonomy'}]
for source in honesty['sources']:
    url = source['url'].lower()
    assert source['url'].startswith('https://')
    assert not any(token in url for token in ['utm_', 'chatgpt', 'openai', 'gclid', 'fbclid'])
for strategy in editorial_after['strategies']:
    if strategy.get('slug') in approved_strategy_slugs:
        url = strategy['evidence']['url']
        assert url.startswith('https://')
        assert not any(token in url.lower() for token in ['utm_', 'chatgpt', 'openai', 'gclid', 'fbclid'])

print('Honesty canonical migration invariants passed.')
