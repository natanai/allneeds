import { describe, expect, it } from 'vitest';

import { fauxFeelings, feelings, needs } from '../catalog';
import { observationInferenceIndex } from '../generated/observationInference';
import source from './source.json';

describe('Observation inference compiler', () => {
  it('contains the complete canonical entity lexicon and four valid formula slots', () => {
    expect(observationInferenceIndex.catalog.feelings.map((item) => item.slug)).toEqual(feelings.map((item) => item.slug));
    expect(observationInferenceIndex.catalog.needs.map((item) => item.slug)).toEqual(needs.map((item) => item.slug));
    expect(observationInferenceIndex.catalog.fauxFeelings.map((item) => item.slug)).toEqual(fauxFeelings.map((item) => item.slug));
    expect(observationInferenceIndex.slots.map((slot) => slot.id)).toEqual(['time', 'context', 'sensory', 'measure']);
    expect(observationInferenceIndex.slots.every((slot) => slot.detectors.length > 0)).toBe(true);
    expect(observationInferenceIndex.catalog.needs.every((need) => (
      Array.isArray(need.feelingSlugs) && Array.isArray(need.fauxFeelingSlugs)
    ))).toBe(true);
  });

  it('preserves complete expression identities and unique cue provenance', () => {
    const cueIds = observationInferenceIndex.expressions.flatMap((expression) => expression.cueIds);
    expect(cueIds).toHaveLength(observationInferenceIndex.provenance.cueRows);
    expect(new Set(cueIds).size).toBe(cueIds.length);
    expect(observationInferenceIndex.expressions.map((item) => item.id)).toEqual(source.expressions.map((item) => item.id));
  });

  it('derives Faux Feeling to Need links from the current canonical Need owners', () => {
    observationInferenceIndex.catalog.fauxFeelings.forEach((fauxFeeling) => {
      const expected = observationInferenceIndex.catalog.needs
        .filter((need) => need.fauxFeelingSlugs.some((slug) => slug === fauxFeeling.slug))
        .map((need) => need.slug);
      expect([...fauxFeeling.needSlugs], fauxFeeling.slug).toEqual(expected);
    });
  });
});
