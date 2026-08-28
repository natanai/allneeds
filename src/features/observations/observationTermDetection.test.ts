import { describe, expect, it } from 'vitest';

import { detectObservationTerms } from './observationTermDetection';

describe('shared Observation term detection', () => {
  it('links exact catalog words without selecting or inferring anything', () => {
    const result = detectObservationTerms('I felt sad and betrayed, and I was wanting safety.');
    expect(result.feelings.map((item) => item.title)).toContain('Sad');
    expect(result.fauxFeelings.map((item) => item.title)).toContain('Betrayed');
    expect(result.needs.map((item) => item.title)).toContain('Safety');
  });

  it('returns no catalog matches for unrelated text', () => {
    expect(detectObservationTerms('We stopped talking after dinner.')).toEqual({
      feelings: [],
      needs: [],
      fauxFeelings: [],
    });
  });
});
