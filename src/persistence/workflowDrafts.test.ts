import { describe, expect, it } from 'vitest';

import { customTermId } from '../features/alexithymia/customWordIdentity';
import type { StorageDriver } from './storage';
import {
  ALEXITHYMIA_DRAFT_STORAGE_KEY,
  BODY_CUES_DRAFT_STORAGE_KEY,
  clearAlexithymiaDraft,
  clearBodyCuesDraft,
  clearInventoryDraft,
  clearJournalDraft,
  clearNeedStrategyDraft,
  clearObservationDraft,
  INVENTORY_DRAFT_STORAGE_KEY,
  JOURNAL_DRAFT_STORAGE_KEY,
  NEED_STRATEGY_DRAFT_STORAGE_PREFIX,
  OBSERVATION_DRAFT_STORAGE_KEY,
  readAlexithymiaDraft,
  readBodyCuesDraft,
  readInventoryDraft,
  readJournalDraft,
  readNeedStrategyDraft,
  readObservationDraft,
  writeAlexithymiaDraft,
  writeAlexithymiaDraftAgainst,
  writeBodyCuesDraft,
  writeInventoryDraft,
  writeJournalDraft,
  writeNeedStrategyDraft,
  writeObservationDraft,
} from './workflowDrafts';

function memoryStorage(): StorageDriver {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

describe('workflow drafts', () => {
  it('keeps a new journal draft independent from entry edit drafts, including unknown intensity and mood', () => {
    const storage = memoryStorage();
    const draft = { notes: 'New page', emotion: '', intensity: 5, selectedNeeds: [], tags: '', editingId: null };
    writeJournalDraft({ ...draft, mood: { kind: 'rated', value: -8, arousal: 7 }, experiencedAt: '2026-10-01T08:30' }, storage);
    writeJournalDraft({ ...draft, notes: 'An edited page', editingId: 'old', feelings: [{ feeling: 'Sad', intensity: 5, ratingSource: 'unknown' }] }, storage, 'old');
    expect(readJournalDraft(storage)?.notes).toBe('New page');
    expect(readJournalDraft(storage)?.mood).toEqual({ kind: 'rated', value: -5, arousal: 5 });
    expect(readJournalDraft(storage, 'old')?.feelings?.[0]?.ratingSource).toBe('unknown');
    clearJournalDraft(storage, 'old');
    expect(readJournalDraft(storage, 'old')).toBeNull();
    expect(readJournalDraft(storage)?.experiencedAt).toBe('2026-10-01T08:30');
  });
  it('round-trips and normalizes a journal composer draft', () => {
    const storage = memoryStorage();
    writeJournalDraft({
      notes: 'A reflection',
      emotion: 'Calm',
      intensity: 12,
      feelings: [{ feeling: 'Calm', intensity: 12 }, { feeling: 'Hopeful', intensity: 6 }],
      selectedNeeds: ['rest', 'rest', 'space'],
      tags: 'evening',
      editingId: null,
    }, storage);

    expect(readJournalDraft(storage)).toEqual({
      notes: 'A reflection',
      emotion: 'Calm',
      intensity: 10,
      feelings: [{ feeling: 'Calm', intensity: 10 }, { feeling: 'Hopeful', intensity: 6 }],
      selectedNeeds: ['rest', 'space'],
      tags: 'evening',
      editingId: null,
    });
    clearJournalDraft(storage);
    expect(storage.getItem(JOURNAL_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('removes an empty journal draft instead of reopening an empty composer', () => {
    const storage = memoryStorage();
    writeJournalDraft({ notes: 'temporary', emotion: '', intensity: 5, selectedNeeds: [], tags: '', editingId: null }, storage);
    writeJournalDraft({ notes: '', emotion: '', intensity: 5, selectedNeeds: [], tags: '', editingId: null }, storage);
    expect(readJournalDraft(storage)).toBeNull();
  });
  it('preserves a legacy edit before the former combined draft key is replaced by a new page', () => {
    const storage = memoryStorage();
    const draft = { notes: 'An old edit', emotion: '', intensity: 5, selectedNeeds: [], tags: '', editingId: 'legacy-entry' };
    writeJournalDraft(draft, storage);
    writeJournalDraft({ ...draft, notes: 'A new page', editingId: null }, storage);
    expect(readJournalDraft(storage, 'legacy-entry')?.notes).toBe('An old edit');
    expect(readJournalDraft(storage)?.notes).toBe('A new page');
  });

  it('round-trips and clears an observation draft', () => {
    const storage = memoryStorage();
    writeObservationDraft({
      text: 'On Tuesday I heard the door close twice.',
      feelingsMode: 'met',
      showSuggestions: true,
      showExample: false,
    }, storage);

    expect(readObservationDraft(storage)?.feelingsMode).toBe('met');
    clearObservationDraft(storage);
    expect(storage.getItem(OBSERVATION_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('normalizes body-cue intensity and clears when every cue is off', () => {
    const storage = memoryStorage();
    writeBodyCuesDraft({ selected: { jaw: 42, shoulders: 108, ignored: 0 }, showAll: true }, storage);
    expect(readBodyCuesDraft(storage)).toEqual({ selected: { jaw: 40, shoulders: 100 }, showAll: true });
    writeBodyCuesDraft({ selected: { jaw: 0 }, showAll: false }, storage);
    expect(storage.getItem(BODY_CUES_DRAFT_STORAGE_KEY)).toBeNull();
    clearBodyCuesDraft(storage);
  });

  it('retains inventory browsing context and unsaved add/edit fields', () => {
    const storage = memoryStorage();
    writeInventoryDraft({
      coverageFilter: 'missing',
      expandedNeed: 'rest',
      add: {
        title: 'Quiet tea',
        description: 'Sit by the window.',
        selectedNeeds: ['rest', 'rest'],
        firstName: 'Nat',
        location: '',
      },
      edit: {
        id: 'strategy-1',
        title: 'Updated title',
        description: 'Updated description',
        selectedNeeds: ['rest', 'rest', 'space'],
        firstName: 'Nat',
        location: 'Missouri',
        visibility: 'followers',
      },
    }, storage);
    expect(readInventoryDraft(storage)).toEqual({
      coverageFilter: 'missing',
      expandedNeed: 'rest',
      add: {
        title: 'Quiet tea',
        description: 'Sit by the window.',
        selectedNeeds: ['rest'],
        firstName: 'Nat',
        location: '',
      },
      edit: {
        id: 'strategy-1',
        title: 'Updated title',
        description: 'Updated description',
        selectedNeeds: ['rest', 'space'],
        firstName: 'Nat',
        location: 'Missouri',
        visibility: 'followers',
      },
    });
    clearInventoryDraft(storage);
    expect(storage.getItem(INVENTORY_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('normalizes the four-stage alexithymia draft and clears a fresh lane', () => {
    const storage = memoryStorage();
    writeAlexithymiaDraft({
      stage: 12,
      observation: '  We stopped talking.',
      openRegion: 'chest',
      selectedCues: { tight_chest: 113, fluttering: -2 },
      bodyClear: false,
      shape: { energy: 2, pleasantness: -2 },
      decisions: { 'candidate:anxiety': 'fits', 'candidate:fear': 'not-this-time' },
      termOrder: ['candidate:anxiety', 'candidate:anxiety'],
      customTerms: ['Mixed up', 'Mixed up'],
      noWordYet: false,
      selectedNeeds: ['safety', 'safety'],
      statement: 'I feel anxious because I need safety.',
      statementEdited: true,
    }, storage);
    expect(readAlexithymiaDraft(storage)).toEqual({
      stage: 4,
      observation: 'We stopped talking.',
      openRegion: 'chest',
      selectedCues: { tight_chest: 100 },
      bodyClear: false,
      shape: { energy: 1, pleasantness: 0 },
      decisions: { 'candidate:anxiety': 'fits', 'candidate:fear': 'not-this-time' },
      termOrder: ['candidate:anxiety'],
      customTerms: ['Mixed up'],
      noWordYet: false,
      selectedNeeds: ['safety'],
      statement: 'I feel anxious because I need safety.',
      statementEdited: true,
    });
    writeAlexithymiaDraft({
      stage: 0,
      observation: '',
      openRegion: null,
      selectedCues: {},
      bodyClear: false,
      shape: {},
      decisions: {},
      termOrder: [],
      customTerms: [],
      noWordYet: false,
      selectedNeeds: [],
      statement: '',
      statementEdited: false,
    }, storage);
    expect(storage.getItem(ALEXITHYMIA_DRAFT_STORAGE_KEY)).toBeNull();
    clearAlexithymiaDraft(storage);
  });

  it('migrates old custom-word identities once and keeps new punctuation identities independent', () => {
    const storage = memoryStorage();
    const base = { stage: 3, observation: '', openRegion: null, selectedCues: {}, bodyClear: false,
      shape: {}, noWordYet: false, selectedNeeds: [], statement: '', statementEdited: false };
    writeAlexithymiaDraft({ ...base, customTerms: ['mixed up'], decisions: { 'working:mixed-up': 'maybe' }, termOrder: ['working:mixed-up'] }, storage);
    const migrated = readAlexithymiaDraft(storage)!;
    expect(migrated.termOrder).toEqual([customTermId('mixed up')]);
    expect(migrated.decisions[customTermId('mixed up')]).toBe('maybe');
    const next = { ...migrated, customTerms: ['mixed up', 'mixed-up'],
      decisions: { [customTermId('mixed up')]: 'maybe' as const, [customTermId('mixed-up')]: 'fits' as const },
      termOrder: [customTermId('mixed-up'), customTermId('mixed up')], wordFilter: 'mine' as const, wordQuery: 'mixed' };
    writeAlexithymiaDraft(next, storage);
    expect(readAlexithymiaDraft(storage)).toEqual(next);
  });

  it('round-trips uncertainty-only Journal context and rejects unavailable check-in storage', () => {
    const storage = memoryStorage();
    writeJournalDraft({ notes: '', emotion: '', intensity: 5, selectedNeeds: [], tags: '', editingId: null,
      guidedSupport: { observation: '', statement: '', terms: [], noWordYet: true } }, storage);
    expect(readJournalDraft(storage)?.guidedSupport?.noWordYet).toBe(true);
    const draft = { stage: 1, observation: '', openRegion: null, selectedCues: {}, bodyClear: false,
      shape: {}, decisions: {}, termOrder: [], customTerms: [], noWordYet: false, selectedNeeds: [], statement: '', statementEdited: false };
    expect(() => writeAlexithymiaDraft(draft, null)).toThrow('not saved');
  });

  it('rejects stale check-in writes after another tab edits, replaces, or completes the draft', () => {
    const storage = memoryStorage();
    const base = { checkInId: 'first', stage: 1, observation: 'Original', openRegion: null, selectedCues: {}, bodyClear: false,
      shape: {}, decisions: {}, termOrder: [], customTerms: [], noWordYet: false, selectedNeeds: [], statement: '', statementEdited: false };
    const first = writeAlexithymiaDraftAgainst(base, null, storage)!.data;
    const current = writeAlexithymiaDraftAgainst({ ...first, observation: 'My next edit' }, first, storage)!.data;
    writeAlexithymiaDraft({ ...current, observation: 'A second tab edited this' }, storage);
    expect(() => writeAlexithymiaDraftAgainst({ ...current, observation: 'A stale edit' }, current, storage)).toThrow('another tab');
    expect(readAlexithymiaDraft(storage)?.observation).toBe('A second tab edited this');
    writeAlexithymiaDraft({ ...base, checkInId: 'second', observation: 'A new check-in' }, storage);
    expect(() => writeAlexithymiaDraftAgainst(current, current, storage)).toThrow('another tab');
    expect(readAlexithymiaDraft(storage)?.checkInId).toBe('second');
    clearAlexithymiaDraft(storage);
    expect(() => writeAlexithymiaDraftAgainst(current, current, storage)).toThrow('another tab');
    expect(readAlexithymiaDraft(storage)).toBeNull();
  });

  it('migrates compatible v1 clues and one recognized word at the persistence boundary', () => {
    const storage = memoryStorage();
    storage.setItem(ALEXITHYMIA_DRAFT_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-08-27T12:00:00.000Z',
      data: {
        phase: 6,
        openRegion: 'throat',
        selectedCues: { tight_throat: 7 },
        energy: 0.5,
        valence: -0.5,
        compassTouched: true,
        selectedEmotion: 'anxiety',
        journalOpen: true,
        reflection: 'obsolete care-step text',
        journalNeeds: ['support'],
        intensity: 8,
      },
    }));

    expect(readAlexithymiaDraft(storage)).toEqual({
      stage: 3,
      observation: '',
      openRegion: 'throat',
      selectedCues: { tight_throat: 70 },
      bodyClear: false,
      shape: { pleasantness: 0.25, energy: 0.75 },
      decisions: { 'candidate:anxiety': 'fits' },
      termOrder: ['candidate:anxiety'],
      customTerms: [],
      noWordYet: false,
      selectedNeeds: [],
      statement: '',
      statementEdited: false,
    });
    expect(JSON.parse(storage.getItem(ALEXITHYMIA_DRAFT_STORAGE_KEY) ?? '{}').schemaVersion).toBe(2);
  });

  it('keeps personal-strategy drafts separate by need and clears a default empty form', () => {
    const storage = memoryStorage();
    writeNeedStrategyDraft('rest', {
      title: 'Tea by the window',
      description: 'Pause for ten quiet minutes.',
      selectedNeeds: ['rest', 'calm', 'rest'],
      firstName: '',
      location: 'Home',
    }, storage);
    writeNeedStrategyDraft('calm', {
      title: 'Slow exhale',
      description: 'Breathe out longer than breathing in.',
      selectedNeeds: ['calm'],
      firstName: '',
      location: '',
    }, storage);

    expect(readNeedStrategyDraft('rest', storage)?.selectedNeeds).toEqual(['rest', 'calm']);
    expect(readNeedStrategyDraft('calm', storage)?.title).toBe('Slow exhale');
    clearNeedStrategyDraft('rest', storage);
    expect(storage.getItem(`${NEED_STRATEGY_DRAFT_STORAGE_PREFIX}:rest`)).toBeNull();

    writeNeedStrategyDraft('calm', {
      title: '',
      description: '',
      selectedNeeds: ['calm'],
      firstName: '',
      location: '',
    }, storage);
    expect(readNeedStrategyDraft('calm', storage)).toBeNull();
  });
});
