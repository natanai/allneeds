import { describe, expect, it } from 'vitest';
import { JOURNAL_ENTRY_PREFERENCE_KEY, readJournalEntryPreference, writeJournalEntryPreference } from './journalEntryPreference';
import type { StorageDriver } from './storage';

describe('entry starting preference', () => {
  it('requires an explicit valid choice and can return to asking each time', () => {
    const values = new Map<string, string>();
    const storage: StorageDriver = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } };
    expect(readJournalEntryPreference(storage)).toBe('ask');
    values.set(JOURNAL_ENTRY_PREFERENCE_KEY, 'unknown');
    expect(readJournalEntryPreference(storage)).toBe('ask');
    writeJournalEntryPreference('check-in', storage);
    expect(readJournalEntryPreference(storage)).toBe('check-in');
    writeJournalEntryPreference('writing', storage);
    expect(readJournalEntryPreference(storage)).toBe('writing');
    writeJournalEntryPreference('ask', storage);
    expect(readJournalEntryPreference(storage)).toBe('ask');
    expect(readJournalEntryPreference(null)).toBe('ask');
    expect(() => writeJournalEntryPreference('check-in', null)).toThrow(/could not be saved/);
  });
});
