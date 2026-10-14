import { describe, expect, it } from 'vitest';
import { checkInWithObservation, createCheckInDraft, journalDraftFromCheckIn } from './checkInDraft';
import { createSupportJournalDraft, statementFromDraft } from './alexithymiaTerms';
import { readAlexithymiaDraft, writeAlexithymiaDraftAgainst } from '../../persistence/workflowDrafts';
import type { StorageDriver } from '../../persistence/storage';

const memory = (): StorageDriver => {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } };
};

describe('Observations into the existing check-in', () => {
  it('retains possibilities across reload without making them reported Feelings, Needs, or ratings', () => {
    const storage = memory();
    const draft = checkInWithObservation('I felt anxiety after waiting for support.', 'unmet');
    writeAlexithymiaDraftAgainst(draft, null, storage);
    const restored = readAlexithymiaDraft(storage)!;
    expect(restored.observationSuggestions?.termIds.length).toBeGreaterThan(0);
    expect(restored.observationSuggestions?.needSlugs).toContain('support');
    expect(restored.decisions).toEqual({});
    expect(restored.selectedNeeds).toEqual([]);
    expect(restored.shape).toEqual({});
    const journal = createSupportJournalDraft({ observation: restored.observation, terms: [], needSlugs: restored.selectedNeeds, statement: '', checkInId: restored.checkInId });
    expect(journal.notes).toBe(restored.observation);
    expect(journal.feelings).toEqual([]);
    expect(journal.selectedNeeds).toEqual([]);
    expect(journal.mood).toBeUndefined();
    expect(journal.guidedSupport?.terms).toEqual([]);
  });

  it('updates the same check-in while retaining every explicit choice and personal wording', () => {
    const current = {
      ...createCheckInDraft(), stage: 4, observation: 'The old observation.',
      selectedCues: { 'chest-tight': 65 }, shape: { energy: .25 },
      decisions: { 'candidate:fear': 'maybe' as const }, termOrder: ['candidate:fear'],
      feelingIntensities: {}, selectedNeeds: ['support'], customTerms: ['😶'],
      statement: 'My own words stay here.', statementEdited: true,
    };
    const updated = checkInWithObservation('They closed the laptop.', 'met', current);
    expect(updated).toMatchObject({
      checkInId: current.checkInId, stage: 1, selectedCues: current.selectedCues,
      shape: current.shape, decisions: current.decisions, termOrder: current.termOrder,
      selectedNeeds: current.selectedNeeds, customTerms: current.customTerms,
      statement: current.statement, statementEdited: true,
    });
    expect(updated.observation).toBe('They closed the laptop.');
    const journal = journalDraftFromCheckIn(updated);
    expect(journal.notes).toBe(current.statement);
    expect(journal.selectedNeeds).toEqual(['support']);
    expect(journal.feelings).toEqual([{ feeling: 'Fear', intensity: 5, ratingSource: 'unknown' }]);
    expect(journal.guidedSupport?.checkInId).toBe(current.checkInId);
    expect(journal.guidedSupport?.bodyClues).toHaveLength(1);
  });

  it('refreshes untouched generated wording and rejects a stale replacement', () => {
    const storage = memory();
    const first = checkInWithObservation('The old observation.', 'unmet');
    first.statement = statementFromDraft(first);
    writeAlexithymiaDraftAgainst(first, null, storage);
    const expected = readAlexithymiaDraft(storage);
    const next = checkInWithObservation('They closed the laptop.', 'unmet', first);
    expect(next.statement).toContain('they closed the laptop');
    const newer = { ...first, observation: 'Work from another tab.' };
    writeAlexithymiaDraftAgainst(newer, expected, storage);
    expect(() => writeAlexithymiaDraftAgainst(next, expected, storage)).toThrow(/another tab/);
    expect(readAlexithymiaDraft(storage)?.observation).toBe(newer.observation);
  });

  it('retains a named Faux Feeling in its own role without recording it as a catalog Feeling', () => {
    const draft = checkInWithObservation('I felt betrayed.', 'unmet');
    expect(draft.observationSuggestions?.termIds).toContain('faux:betrayed');
    draft.decisions = { 'faux:betrayed': 'maybe' };
    draft.termOrder = ['faux:betrayed'];
    const journal = journalDraftFromCheckIn(draft);
    expect(journal.feelings).toEqual([]);
    expect(journal.guidedSupport?.terms).toEqual([{ label: 'Betrayed', role: 'faux-feeling', decision: 'maybe' }]);
  });
});
