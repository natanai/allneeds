import { describe, expect, it } from 'vitest';

import bodyRegionsRaw from '../../data/body-regions.json';
import {
  computeBodyCueMatches,
  describeCueIntensity,
  MAX_BODY_CUE_ASSOCIATION_WEIGHT,
} from './bodyCueMath';

describe('body cue inference', () => {
  it('scores candidates independently against the authored maximum', () => {
    const results = computeBodyCueMatches(
      [
        { option: { emotions: { anxiety: 0.7, calm: 0.35 } }, intensity: 100 },
        { option: { emotions: { calm: 1.4 } }, intensity: 50 },
      ],
      100,
    );

    expect(results.map(({ key }) => key)).toEqual(['calm', 'anxiety']);
    expect(results[0]?.percent).toBeCloseTo(50, 5);
    expect(results[1]?.percent).toBeCloseTo(33.33, 1);
    expect(results.reduce((total, result) => total + result.percent, 0)).not.toBeCloseTo(100, 5);
  });

  it('preserves the authored temperature-flush ranking instead of favoring sparse candidates', () => {
    const regions = bodyRegionsRaw as unknown as Array<{
      options: Array<{ id: string; emotions?: Record<string, number> }>;
    }>;
    const temperatureFlush = regions.flatMap((region) => region.options)
      .find((option) => option.id === 'temp-flush');
    expect(temperatureFlush).toBeDefined();

    const results = computeBodyCueMatches(
      [{ option: temperatureFlush ?? {}, intensity: 100 }],
      100,
    );
    const percentByKey = new Map(results.map((result) => [result.key, result.percent]));

    expect(results.map(({ key }) => key).slice(0, 4)).toEqual(['anger', 'excited', 'shame', 'pride']);
    expect(percentByKey.get('anger')).toBeCloseTo(85.71, 1);
    expect(percentByKey.get('pride')).toBeCloseTo(42.86, 1);
    expect(percentByKey.get('anger')).toBeGreaterThan(percentByKey.get('pride') ?? 100);
  });

  it('keeps every authored association inside the scorer denominator contract', () => {
    const regions = bodyRegionsRaw as unknown as Array<{
      options: Array<{ emotions?: Record<string, number> }>;
    }>;
    const authoredWeights = regions.flatMap((region) => region.options)
      .flatMap((option) => Object.values(option.emotions ?? {}));

    expect(authoredWeights.length).toBeGreaterThan(0);
    expect(Math.min(...authoredWeights)).toBeGreaterThan(0);
    expect(Math.max(...authoredWeights)).toBe(MAX_BODY_CUE_ASSOCIATION_WEIGHT);
    expect(authoredWeights.every((weight) => weight <= MAX_BODY_CUE_ASSOCIATION_WEIGHT)).toBe(true);
  });

  it('ignores off cues and returns no match without positive-intensity input', () => {
    expect(computeBodyCueMatches([
      { option: { emotions: { anxiety: 1.4 } }, intensity: 0 },
      { option: { emotions: { calm: 1.4 } }, intensity: Number.NaN },
    ], 100)).toEqual([]);
  });

  it('uses the same language as the source sliders', () => {
    expect(describeCueIntensity(0)).toBe('Off');
    expect(describeCueIntensity(20)).toBe('Hint · 20%');
    expect(describeCueIntensity(55)).toBe('Noticeable · 55%');
    expect(describeCueIntensity(80)).toBe('Strong · 80%');
  });
});
