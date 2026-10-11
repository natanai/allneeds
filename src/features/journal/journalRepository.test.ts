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
    expect(readJournal(storage)[0]?.feelings).toEqual([{ feeling: 'sad', intensity: 5, ratingSource: 'unknown' }]);
    expect(JSON.parse(storage.getItem(JOURNAL_STORAGE_KEY) ?? '{}').schemaVersion).toBe(1);
  });

  it('round-trips normalized entries', () => {
    const storage = new MemoryStorage();
    const entry = createJournalRecord({ notes: '  Reflection  ', emotion: ' hurt ', intensity: 12, needs: ['support'], tags: ['work', 'work'] });
    writeJournal([entry], storage);
    expect(readJournal(storage)[0]).toMatchObject({ notes: 'Reflection', emotion: 'hurt', intensity: 10, tags: ['work'] });
  });

  it('keeps mood, experienced time, and original creation time through normalizing', () => {
    const storage = new MemoryStorage();
    const entry = createJournalRecord({ notes: 'A moment last week', mood: { kind: 'rated', value: -3, arousal: 4 }, experiencedAtISO: '2026-10-01T20:30:00Z' });
    writeJournal([entry], storage);
    expect(readJournal(storage)[0]).toMatchObject({ mood: { kind: 'rated', value: -3, arousal: 4 }, experiencedAtISO: '2026-10-01T20:30:00.000Z', createdAtISO: entry.dateISO });
    const mixed = { ...entry, mood: { kind: 'mixed' as const } };
    writeJournal([mixed], storage);
    expect(readJournal(storage)[0]?.mood).toEqual({ kind: 'mixed' });
  });

  it('clamps both coordinates while preserving legacy valence-only ratings', () => {
    const storage = new MemoryStorage();
    const current = createJournalRecord({ notes: 'Both axes', mood: { kind: 'rated', value: -9, arousal: 12 } });
    const legacy = { ...current, id: 'legacy', mood: { kind: 'rated' as const, value: 2 } };
    writeJournal([current, legacy], storage);
    expect(readJournal(storage).find((item) => item.id === current.id)?.mood).toEqual({ kind: 'rated', value: -5, arousal: 5 });
    expect(readJournal(storage).find((item) => item.id === 'legacy')?.mood).toEqual({ kind: 'rated', value: 2 });
  });

  it('does not promote a missing legacy intensity to a reported rating after a second save', () => {
    const storage = new MemoryStorage();
    storage.setItem('journal:v2', JSON.stringify([{ id: 'old', dateISO: '2026-01-01', notes: 'old', feelings: ['Sad'] }]));
    writeJournal(readJournal(storage), storage);
    expect(readJournal(storage)[0]?.feelings[0]?.ratingSource).toBe('unknown');
    expect(readJournal(storage)[0]?.mood).toBeUndefined();
  });

  it('does not report a successful save when storage is unavailable', () => {
    expect(() => writeJournal([], null)).toThrow('not saved');
  });
  it('prefers a reported duplicate over an unknown legacy display fallback', () => {
    const entry = createJournalRecord({ notes: 'A duplicate label', feelings: [{ feeling: 'Sad', intensity: 5, ratingSource: 'unknown' }, { feeling: 'sad', intensity: 3 }] });
    expect(entry.feelings).toEqual([{ feeling: 'sad', intensity: 3 }]);
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

  it('round-trips structured guided-support word roles without promoting them to journal Feelings', () => {
    const storage = new MemoryStorage();
    const entry = createJournalRecord({
      notes: 'I feel anxious and guilt.',
      feelings: [{ feeling: 'Anxiety', intensity: 5 }],
      guidedSupport: {
        observation: 'We stopped talking.',
        terms: [
          { label: 'Anxiety', role: 'feeling' },
          { label: 'Guilt', role: 'working' },
          { label: 'Blamed', role: 'faux-feeling' },
        ],
        statement: 'I feel anxious and guilt.',
      },
    });
    writeJournal([entry], storage);
    expect(readJournal(storage)[0]).toMatchObject({
      feelings: [{ feeling: 'Anxiety', intensity: 5 }],
      guidedSupport: {
        observation: 'We stopped talking.',
        terms: [
          { label: 'Anxiety', role: 'feeling' },
          { label: 'Guilt', role: 'working' },
          { label: 'Blamed', role: 'faux-feeling' },
        ],
      },
    });
  });
});
