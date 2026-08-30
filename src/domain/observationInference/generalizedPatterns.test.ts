import { describe, expect, it } from 'vitest';

import { analyzeObservation } from './analyze';

function eventFamilyIds(text: string) {
  return analyzeObservation(text).annotations.flatMap((annotation) => annotation.evidence
    .filter((evidence) => evidence.kind === 'eventFamily')
    .map((evidence) => evidence.kind === 'eventFamily' ? evidence.familyId : ''));
}

function expectRelatedFamily(text: string, familyId: string, expectedNeed: string) {
  const analysis = analyzeObservation(text);
  expect(eventFamilyIds(text), text).toContain(familyId);
  expect(analysis.suggestions.needs, text).toContainEqual(expect.objectContaining({
    slug: expectedNeed,
    basis: 'related',
  }));
  expect([...analysis.suggestions.feelings, ...analysis.suggestions.needs].every((candidate) => (
    candidate.basis !== 'direct'
  )), text).toBe(true);
}

describe('Observation generalized event-family phrasing', () => {
  it('recognizes the live-review sentence without requiring a special input format', () => {
    const text = 'I got in a fight with my partner. They said “you are stupid” to me.';
    const analysis = analyzeObservation(text);

    expect(eventFamilyIds(text)).toContain('directed-personal-evaluation');
    expect(analysis.suggestions.needs).toContainEqual(expect.objectContaining({
      slug: 'respect',
      basis: 'related',
    }));
    expect(analysis.suggestions.feelings.length).toBeGreaterThan(0);
  });

  it.each([
    ['My coworker said I was incompetent.', 'directed-personal-evaluation', 'respect'],
    ['I was called lazy.', 'directed-personal-evaluation', 'respect'],
    ['My coworker described me as selfish.', 'directed-personal-evaluation', 'respect'],
    ['My partner said “you are overreacting” to me.', 'dismissal-of-experience', 'understanding'],
    ['I was told I was too sensitive.', 'dismissal-of-experience', 'understanding'],
    ["My coworker wouldn't let me finish speaking.", 'interruption-of-speech', 'to-be-heard'],
    ['I was talked over.', 'interruption-of-speech', 'to-be-heard'],
    ["They didn't invite me to the meeting.", 'social-exclusion', 'inclusion'],
    ["I wasn't included in the group chat.", 'social-exclusion', 'inclusion'],
    ['Everyone went without me.', 'social-exclusion', 'inclusion'],
    ['My manager gave me no time to decide.', 'constrained-decision', 'autonomy'],
    ['I had no choice but to sign.', 'constrained-decision', 'autonomy'],
    ["We planned to meet at 7 but they didn't show up.", 'agreement-change', 'dependability'],
    ['They changed the meeting without telling me.', 'agreement-change', 'dependability'],
  ])('recognizes ordinary phrasing: %s', (text, familyId, expectedNeed) => {
    expectRelatedFamily(text, familyId, expectedNeed);
  });

  it.each([
    'My coworker said “the computer is stupid” to me.',
    'My coworker said to me “the computer is stupid.”',
    'My coworker said “this plan is dumb” to me.',
  ])('does not borrow a trait label from a quoted evaluation of something else: %s', (text) => {
    const analysis = analyzeObservation(text);
    expect(eventFamilyIds(text), text).not.toContain('directed-personal-evaluation');
    expect(analysis.suggestions.needs.length, text).toBe(4);
    expect(analysis.suggestions.feelings.length, text).toBe(4);
    expect([...analysis.suggestions.feelings, ...analysis.suggestions.needs].every((candidate) => candidate.basis !== 'direct'), text).toBe(true);
  });

  it('keeps the pre-target and post-target forms equivalent', () => {
    for (const text of [
      'My coworker said to me “you are stupid.”',
      'My coworker said “you are stupid” to me.',
    ]) {
      expectRelatedFamily(text, 'directed-personal-evaluation', 'respect');
    }
  });
});
