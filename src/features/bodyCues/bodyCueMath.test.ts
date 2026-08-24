import { describe, expect, it } from 'vitest';

import { computeBodyCueMatches, describeCueIntensity } from './bodyCueMath';

describe('body cue inference', () => {
  it('normalizes each match against the total weighted score', () => {
    const results = computeBodyCueMatches(
      {
        anxiety: { bodyCues: [{ optionId: 'tight', relativeWeight: 0.5 }] },
        calm: { bodyCues: [{ optionId: 'warm', relativeWeight: 1 }] },
        _meta: { slugMap: { anxious: 'anxiety' } },
      },
      { tight: 100, warm: 25 },
    );

    expect(results.map(({ key }) => key)).toEqual(['anxiety', 'calm']);
    expect(results[0]?.percent).toBeCloseTo(66.67, 1);
    expect(results[1]?.percent).toBeCloseTo(33.33, 1);
  });

  it('uses the same language as the source sliders', () => {
    expect(describeCueIntensity(0)).toBe('Off');
    expect(describeCueIntensity(20)).toBe('Hint · 20%');
    expect(describeCueIntensity(55)).toBe('Noticeable · 55%');
    expect(describeCueIntensity(80)).toBe('Strong · 80%');
  });
});
