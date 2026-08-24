import { describe, expect, it } from 'vitest';

import type { StorageDriver } from '../../persistence/storage';
import { JOURNAL_STORAGE_KEY, createJournalRecord, readJournal, writeJournal } from './journalRepository';

class MemoryStorage implements StorageDriver {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('journalRepository', () => {
  it('imports journal:v2 into the versioned local store', () => {
    const storage = new MemoryStorage();
    storage.setItem('journal:v2', JSON.stringify([{ id: 'one', dateISO: '2026-01-01', emotion: 'sad', needs: ['support'], tags: ['work'], notes: 'A note' }]));
    expect(readJournal(storage)[0]).toMatchObject({ id: 'one', emotion: 'sad', needs: ['support'] });
    expect(readJournal(storage)[0]?.feelings).toEqual([{ feeling: 'sad', intensity: 5 }]);
    expect(JSON.parse(storage.getItem(JOURNAL_STORAGE_KEY) ?? '{}').schemaVersion).toBe(1);
  });

  it('round-trips normalized entries', () => {
    const storage = new MemoryStorage();
    const entry = createJournalRecord({ notes: '  Reflection  ', emotion: ' hurt ', intensity: 12, needs: ['support'], tags: ['work', 'work'] });
    writeJournal([entry], storage);
    expect(readJournal(storage)[0]).toMatchObject({ notes: 'Reflection', emotion: 'hurt', intensity: 10, tags: ['work'] });
  });

  it('preserves an independent intensity for every selected feeling', () => {
    const storage = new MemoryStorage();
    const entry = createJournalRecord({
      notes: 'Two feelings are present.',
      feelings: [
        { feeling: 'Angry', intensity: 7 },
        { feeling: 'Hurt', intensity: 4 },
      ],
      needs: ['understanding'],
    });
    writeJournal([entry], storage);
    expect(readJournal(storage)[0]).toMatchObject({
      emotion: 'Angry, Hurt',
      intensity: 7,
      feelings: [
        { feeling: 'Angry', intensity: 7 },
        { feeling: 'Hurt', intensity: 4 },
      ],
    });
  });
});
