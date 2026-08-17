import { describe, expect, it } from 'vitest';

import { getMagnetTilt, stableHash } from './magnetMath';

describe('magnet math', () => {
  it('keeps a magnet identity deterministic across renders', () => {
    expect(stableHash('calm')).toBe(stableHash('calm'));
    expect(getMagnetTilt('calm')).toBe(getMagnetTilt('calm'));
  });

  it('keeps decorative tilt subtle', () => {
    for (const id of ['calm', 'sad', 'hopeful', 'bewildered', 'excited']) {
      expect(Math.abs(getMagnetTilt(id))).toBeLessThanOrEqual(2);
    }
  });
});
