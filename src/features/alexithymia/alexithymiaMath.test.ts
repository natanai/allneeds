import { describe, expect, it } from 'vitest';

import { categorizeCompass, inferZone, scoreSensations } from './alexithymiaMath';

describe('alexithymia support inference', () => {
  const selections = [{ option: { emotions: { anxiety: 1.4, calm: 0.2 } }, intensity: 5 }];

  it('weights body associations by intensity and prior rejection', () => {
    expect(scoreSensations(selections)[0]).toMatchObject({ key: 'anxiety', confidence: 1 });
    expect(scoreSensations(selections, { anxiety: 10 })[0]?.key).toBe('calm');
  });

  it('infers the strongest source-compatible affect zone', () => {
    expect(inferZone(selections)).toBe('high-unpleasant');
  });

  it('categorizes compass thresholds', () => {
    expect(categorizeCompass(-0.4, 'energy').key).toBe('low');
    expect(categorizeCompass(0, 'valence').label).toBe('Neutral');
    expect(categorizeCompass(0.8, 'valence').key).toBe('pleasant');
  });
});
