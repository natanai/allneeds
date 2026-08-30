import { describe, expect, it } from 'vitest';

import { analyzeObservation } from './analyze';
import {
  hasSearchableObservationText,
  retrieveNeedCandidates,
  starterFeelingSlugs,
  starterNeedCandidates,
} from './retrieve';

describe('Observation deterministic retrieval', () => {
  it('uses language presence rather than keyword success as the exploration gate', () => {
    expect(hasSearchableObservationText('   ')).toBe(false);
    expect(hasSearchableObservationText('🙂')).toBe(false);
    expect(hasSearchableObservationText('I was there.')).toBe(true);
    expect(hasSearchableObservationText('这是一次观察')).toBe(true);
  });

  it('derives enough deterministic starter vocabulary from the canonical catalogs', () => {
    const needs = starterNeedCandidates();
    expect(needs.length).toBeGreaterThanOrEqual(4);
    expect(new Set(needs.map((need) => need.slug)).size).toBe(needs.length);
    expect(starterFeelingSlugs('unmet').length).toBeGreaterThanOrEqual(4);
    expect(starterFeelingSlugs('met').length).toBeGreaterThanOrEqual(4);
  });

  it('keeps keyword retrieval deterministic', () => {
    const text = 'My friend stopped replying after we made plans.';
    expect(retrieveNeedCandidates(text)).toEqual(retrieveNeedCandidates(text));
  });

  it('guarantees vocabulary even when ordinary language has no useful index hit', () => {
    for (const text of ['I was there.', '这是一次观察', 'Something happened between us.']) {
      const analysis = analyzeObservation(text);
      expect(analysis.suggestions.needs.length, text).toBe(4);
      expect(analysis.suggestions.feelings.length, text).toBe(4);
      expect([...analysis.suggestions.feelings, ...analysis.suggestions.needs].every((candidate) => candidate.basis !== 'direct'), text).toBe(true);
    }
  });
});
