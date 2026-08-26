import { describe, expect, it } from 'vitest';

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

  it('clamps a guided alexithymia lane draft and clears a fresh lane', () => {
    const storage = memoryStorage();
    writeAlexithymiaDraft({
      phase: 12,
      openRegion: 'chest',
      selectedCues: { tight_chest: 13, fluttering: -2 },
      energy: 2,
      valence: -2,
      compassTouched: true,
      selectedEmotion: 'anxiety',
      journalOpen: true,
      reflection: 'I noticed my chest tighten.',
      journalNeeds: ['safety', 'safety'],
      intensity: 11,
    }, storage);
    expect(readAlexithymiaDraft(storage)).toEqual({
      phase: 8,
      openRegion: 'chest',
      selectedCues: { tight_chest: 10, fluttering: 0 },
      energy: 1,
      valence: -1,
      compassTouched: true,
      selectedEmotion: 'anxiety',
      journalOpen: true,
      reflection: 'I noticed my chest tighten.',
      journalNeeds: ['safety'],
      intensity: 10,
    });
    writeAlexithymiaDraft({
      phase: 0,
      openRegion: null,
      selectedCues: {},
      energy: 0,
      valence: 0,
      compassTouched: false,
      selectedEmotion: null,
      journalOpen: false,
      reflection: '',
      journalNeeds: [],
      intensity: 5,
    }, storage);
    expect(storage.getItem(ALEXITHYMIA_DRAFT_STORAGE_KEY)).toBeNull();
    clearAlexithymiaDraft(storage);
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
