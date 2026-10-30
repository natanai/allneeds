import { describe, expect, it } from 'vitest';
import { formatIntensityRating } from './IntensitySlider';

describe('shared intensity scale', () => {
  it('presents a consistent 0–10 or 1–10 rating without altering stored values', () => {
    expect(formatIntensityRating(0)).toBe('0/10');
    expect(formatIntensityRating(1.5)).toBe('1.5/10');
    expect(formatIntensityRating(7)).toBe('7/10');
    expect(formatIntensityRating(10)).toBe('10/10');
  });
});
