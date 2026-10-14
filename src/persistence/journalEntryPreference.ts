import { getBrowserStorage, type StorageDriver } from './storage';

export const JOURNAL_ENTRY_PREFERENCE_KEY = 'allneeds.v2.journal.entry-start';
export type JournalEntryPreference = 'ask' | 'check-in' | 'writing';

export function readJournalEntryPreference(storage: StorageDriver | null = getBrowserStorage()): JournalEntryPreference {
  try {
    const value = storage?.getItem(JOURNAL_ENTRY_PREFERENCE_KEY);
    return value === 'check-in' || value === 'writing' ? value : 'ask';
  } catch { return 'ask'; }
}

export function writeJournalEntryPreference(value: JournalEntryPreference, storage: StorageDriver | null = getBrowserStorage()) {
  if (!storage) throw new Error('The starting preference could not be saved on this device.');
  if (value === 'ask') storage.removeItem(JOURNAL_ENTRY_PREFERENCE_KEY);
  else storage.setItem(JOURNAL_ENTRY_PREFERENCE_KEY, value);
}
