import { describe, expect, it } from 'vitest';

import editorial from './editorialCatalog.json';
import legacy from './generated/legacyData.json';
import { feelings } from './catalog';
import { compileFeelingCatalog } from './compileFeelingCatalog.mjs';
import { catalogOnlyTerms, profileTerms } from '../features/alexithymia/alexithymiaTerms';
import { observationInferenceIndex } from './generated/observationInference';

describe('canonical Feeling ownership', () => {
  it('retires every legacy Feeling and compiles the complete reviewed family in its catalog order', () => {
    expect(legacy.feelings).toEqual([]);
    expect(Object.keys(editorial.feelings)).toHaveLength(48);
    const compiled = compileFeelingCatalog(editorial.feelings);
    expect(feelings).toEqual(compiled);
    for (const [slug, record] of Object.entries(editorial.feelings)) {
      expect(feelings[record.catalogOrder]).toMatchObject({
        slug, title: record.title, summary: record.summary, sources: record.sources,
        needs: record.needs, fauxFeelings: record.fauxFeelings, bodySignals: record.bodySignals,
      });
    }
  });

  it('uses the same summary in profiled and catalog-only check-in terms and the same identities in Observations', () => {
    const terms = [...profileTerms, ...catalogOnlyTerms].filter((term) => term.role === 'feeling');
    expect(terms).toHaveLength(feelings.length);
    for (const feeling of feelings) {
      const term = terms.find((item) => item.catalogSlug === feeling.slug);
      expect(term?.definition, feeling.slug).toBe(feeling.summary);
      expect(term?.route).toBe(`/feelings/${feeling.slug}`);
      expect(feeling.sources.length).toBeGreaterThan(0);
    }
    expect(observationInferenceIndex.catalog.feelings.map(({ slug, title, needSatisfaction }) => ({ slug, title, needSatisfaction })))
      .toEqual(feelings.map(({ slug, title, needSatisfaction }) => ({ slug, title, needSatisfaction })));
  });

  it('rejects missing sources, incomplete entities, and overlapping or missing catalog positions', () => {
    const source = editorial.feelings.calm;
    expect(() => compileFeelingCatalog({ calm: { ...source, catalogOrder: 0, sources: [] } })).toThrow(/incomplete ownership/);
    expect(() => compileFeelingCatalog({ calm: { ...source, catalogOrder: 0, needs: undefined } })).toThrow(/incomplete ownership/);
    expect(() => compileFeelingCatalog({ calm: { ...source, catalogOrder: 1 } })).toThrow(/catalogOrder/);
    expect(() => compileFeelingCatalog({ calm: { ...source, catalogOrder: 0 }, other: { ...source, catalogOrder: 0 } })).toThrow(/catalogOrder/);
  });
});
