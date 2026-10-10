import { describe, expect, it } from 'vitest';

import { analyzeObservation } from './analyze';
import { annotationDescriptions } from './explain';

describe('Observation annotation explanations', () => {
  it('keeps unlinked surface wording out of the user-facing explanation', () => {
    const annotation = analyzeObservation('Guilt').annotations
      .find((candidate) => candidate.text === 'Guilt')!;
    expect(annotationDescriptions(annotation)).toEqual([]);
  });

  it('shows the actionable catalog meaning once when guidance overlaps it', () => {
    const annotation = analyzeObservation('I felt ignored.').annotations
      .find((candidate) => candidate.text.toLocaleLowerCase('en-US') === 'ignored')!;
    const descriptions = annotationDescriptions(annotation);
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]?.evidence.kind).toBe('entity');
    expect(descriptions[0]?.description).toContain('does not mean the event was unreal');
  });
});
