import { describe, expect, it } from 'vitest';

import { annotateObservation } from './annotate';

function eventFamilyIds(text: string) {
  return annotateObservation(text).annotations.flatMap((annotation) => annotation.evidence
    .filter((evidence) => evidence.kind === 'eventFamily')
    .map((evidence) => evidence.kind === 'eventFamily' ? evidence.familyId : ''));
}

describe('Observation annotation event-family scope', () => {
  it('does not borrow trait-label evidence from the speaker description', () => {
    expect(eventFamilyIds('My rude coworker said to me “hello.”')).not.toContain('directed-personal-evaluation');
    expect(eventFamilyIds('My rude coworker called me a hero.')).not.toContain('directed-personal-evaluation');
  });

  it('recognizes trait-label evidence in the words directed toward the user', () => {
    for (const text of [
      'My coworker said to me “you are rude.”',
      'My coworker said to me “you are rude to me.”',
      'My coworker called me rude.',
      'My coworker told me I was rude.',
    ]) {
      expect(eventFamilyIds(text), text).toContain('directed-personal-evaluation');
    }
  });
});
