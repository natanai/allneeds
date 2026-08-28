from __future__ import annotations

from pathlib import Path

VITE_PATH = Path('vite.config.ts')
TEST_PATH = Path('src/data/honestyAudit.test.ts')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise AssertionError(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)


vite = VITE_PATH.read_text(encoding='utf-8')
old = '''  const canonicalEditorialNeeds = Object.entries(editorial.needs)
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

new = '''  const canonicalEditorialNeeds = Object.entries(editorial.needs)
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
  const compileLegacyNeed = (need: LegacyCatalog['needs'][number]) => {
    const override = editorial.needs[need.slug];
    return {
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
    };
  };
  const compileEditorialNeed = (slug: string, need: CanonicalEditorialNeed) => ({
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
  });

  const remainingLegacyNeeds = legacy.needs
    .filter((need) => !canonicalEditorialNeedSlugs.has(need.slug));
  const totalNeedCount = remainingLegacyNeeds.length + canonicalEditorialNeeds.length;
  const canonicalNeedByOrder = new Map<number, [string, CanonicalEditorialNeed]>();
  canonicalEditorialNeeds.forEach(([slug, need]) => {
    if (!Number.isInteger(need.catalogOrder)
      || need.catalogOrder < 0
      || need.catalogOrder >= totalNeedCount) {
      throw new Error(`Canonical Need ${slug} has invalid catalogOrder ${need.catalogOrder}.`);
    }
    if (canonicalNeedByOrder.has(need.catalogOrder)) {
      throw new Error(`Multiple canonical Needs claim catalogOrder ${need.catalogOrder}.`);
    }
    canonicalNeedByOrder.set(need.catalogOrder, [slug, need]);
  });

  let legacyNeedIndex = 0;
  const needs = Array.from({ length: totalNeedCount }, (_, catalogOrder) => {
    const canonical = canonicalNeedByOrder.get(catalogOrder);
    if (canonical) return compileEditorialNeed(...canonical);

    const legacyNeed = remainingLegacyNeeds[legacyNeedIndex];
    if (!legacyNeed) {
      throw new Error(`No legacy Need available for catalogOrder ${catalogOrder}.`);
    }
    legacyNeedIndex += 1;
    return compileLegacyNeed(legacyNeed);
  });
  if (legacyNeedIndex !== remainingLegacyNeeds.length) {
    throw new Error('Not all legacy Needs were placed in the runtime catalog.');
  }
'''

vite = replace_once(vite, old, new, 'canonical Need compiler block')
VITE_PATH.write_text(vite, encoding='utf-8')

test = TEST_PATH.read_text(encoding='utf-8')
old_import = "import { needsBySlug, strategiesBySlug } from './catalog';\n"
new_import = "import { needs, needsBySlug, strategiesBySlug } from './catalog';\n"
test = replace_once(test, old_import, new_import, 'Honesty catalog import')
anchor = '''  it('gives each approved system strategy its approved human-facing source', () => {\n'''
ordering_test = '''  it('restores Honesty at its canonical catalog position without shifting later Needs', () => {\n    expect(needs).toHaveLength(legacyData.needs.length + 1);\n    expect(needs[19]?.slug).toBe('honesty');\n    expect(needs.slice(0, 19).map((need) => need.slug)).toEqual(\n      legacyData.needs.slice(0, 19).map((need) => need.slug),\n    );\n    expect(needs.slice(20).map((need) => need.slug)).toEqual(\n      legacyData.needs.slice(19).map((need) => need.slug),\n    );\n  });\n\n'''
test = replace_once(test, anchor, ordering_test + anchor, 'Honesty ordering test anchor')
TEST_PATH.write_text(test, encoding='utf-8')

print('Canonical Need ordering compiler and regression test updated.')
