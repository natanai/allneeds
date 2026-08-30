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

  it('keeps the exact same Need candidates across Met and Unmet while changing Feeling projection', () => {
    const text = 'We agreed to meet at 7 and then they canceled.';
    const unmet = analyzeObservation(text, 'unmet');
    const met = analyzeObservation(text, 'met');
    expect(unmet.suggestions.needs.map((need) => need.slug)).toEqual(met.suggestions.needs.map((need) => need.slug));
    expect(unmet.suggestions.feelings).toHaveLength(4);
    expect(met.suggestions.feelings).toHaveLength(4);
    expect(unmet.suggestions.feelings.map((feeling) => feeling.slug)).not.toEqual(met.suggestions.feelings.map((feeling) => feeling.slug));
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
