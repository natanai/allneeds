import { describe, expect, it } from 'vitest';

import { analyzeObservation } from './analyze';

function hasDirect(text: string, entityType: 'feeling' | 'need', slug: string) {
  const analysis = analyzeObservation(text);
  const suggestions = entityType === 'feeling' ? analysis.suggestions.feelings : analysis.suggestions.needs;
  return suggestions.some((candidate) => candidate.slug === slug && candidate.basis === 'direct');
}

describe('Observation direct self-report boundary', () => {
  it('rejects another person’s question or attribution as the user’s direct state', () => {
    const cases = [
      ['She asked if I am angry.', 'feeling', 'angry'],
      ['My friend asked me whether I need rest.', 'need', 'rest'],
      ['Jordan wondered whether I am angry.', 'feeling', 'angry'],
      ['She said maybe I am angry.', 'feeling', 'angry'],
    ] as const;

    cases.forEach(([text, entityType, slug]) => {
      expect(hasDirect(text, entityType, slug), text).toBe(false);
    });
  });

  it('rejects an explicitly negated or denied nested self-attribution', () => {
    const cases = [
      ["I don't think I am angry.", 'feeling', 'angry'],
      ['I never said I am angry.', 'feeling', 'angry'],
      ["I don't believe I need rest.", 'need', 'rest'],
      ['I doubt I am angry.', 'feeling', 'angry'],
    ] as const;

    cases.forEach(([text, entityType, slug]) => {
      expect(hasDirect(text, entityType, slug), text).toBe(false);
    });
  });

  it('still accepts the user’s affirmative reflective and reported self-language', () => {
    expect(hasDirect('I think I am angry.', 'feeling', 'angry')).toBe(true);
    expect(hasDirect('I said I am angry.', 'feeling', 'angry')).toBe(true);
    expect(hasDirect('I believe I need rest.', 'need', 'rest')).toBe(true);
  });
});
