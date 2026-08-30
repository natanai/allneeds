import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { observationInferenceIndex } from '../generated/observationInference';

describe('Observation inference compiler', () => {
  it('keeps generated output synchronized with the canonical source', () => {
    expect(() => execFileSync(process.execPath, ['scripts/compile-observation-inference.mjs', '--check'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    })).not.toThrow();
  });

  it('contains the complete canonical entity lexicon and four valid formula slots', () => {
    expect(observationInferenceIndex.catalog.feelings).toHaveLength(48);
    expect(observationInferenceIndex.catalog.needs).toHaveLength(67);
    expect(observationInferenceIndex.catalog.fauxFeelings).toHaveLength(56);
    expect(observationInferenceIndex.slots.map((slot) => slot.id)).toEqual(['time', 'context', 'sensory', 'measure']);
    expect(observationInferenceIndex.slots.every((slot) => slot.detectors.length > 0)).toBe(true);
    expect(observationInferenceIndex.catalog.needs.every((need) => (
      Array.isArray(need.feelingSlugs) && Array.isArray(need.fauxFeelingSlugs)
    ))).toBe(true);
  });

  it('keeps every migrated cue relationship in one normalized expression', () => {
    const cueIds = observationInferenceIndex.expressions.flatMap((expression) => expression.cueIds);
    expect(cueIds).toHaveLength(observationInferenceIndex.provenance.cueRows);
    expect(new Set(cueIds).size).toBe(cueIds.length);
    expect(observationInferenceIndex.expressions).toHaveLength(28);
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
