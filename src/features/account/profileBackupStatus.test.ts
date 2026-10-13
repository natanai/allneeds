import { describe, expect, it } from 'vitest';
import { captureBrowserStorage } from '../../persistence/browserBackup';
import { INVENTORY_STORAGE_KEY } from '../inventory/inventoryRepository';
import { JOURNAL_STORAGE_KEY } from '../journal/journalRepository';
import {
  PROFILE_BACKUP_STATUS_KEY,
  createProfileBackupReceipt,
  markProfileBackedUp,
  readProfileBackupReceipt,
  readProfileBackupView,
} from './profileBackupStatus';

function storageFor(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  } as Storage;
}

function journal(entries: Array<{ id: string; notes: string }>) {
  return JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-13T14:00:00Z', data: {
    entries: entries.map((entry) => ({ ...entry, dateISO: '2026-10-13T14:00:00Z' })),
  } });
}

function inventory(count: number) {
  return JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-13T14:00:00Z', data: {
    items: Array.from({ length: count }, (_, index) => ({ id: String(index) })),
  } });
}

describe('profile backup receipt', () => {
  it('records the confirmed server timestamp without persisting journal text twice', () => {
    const storage = storageFor({
      [JOURNAL_STORAGE_KEY]: journal([{ id: 'j1', notes: 'Private journal text' }]),
      [INVENTORY_STORAGE_KEY]: inventory(2),
      'nvcApp.navSettings': '{"enabled":{"journal":true}}',
    });
    const snapshot = captureBrowserStorage(storage);
    const result = markProfileBackedUp('did:plc:one', '2026-10-13T16:27:00Z', snapshot, storage);
    expect(result?.summary).toBe('1 new journal entry');
    expect(result?.journalCount).toBe(1);
    expect(result?.strategyCount).toBe(2);
    expect(storage.getItem(PROFILE_BACKUP_STATUS_KEY)).not.toContain('Private journal text');
    expect(captureBrowserStorage(storage)).toEqual(snapshot);
    expect(readProfileBackupView('did:plc:one', storage).pending).toEqual({
      journal: false, inventory: false, settings: false,
    });
    expect(readProfileBackupReceipt('did:plc:other', storage)).toBeNull();
  });

  it('reports a newer journal entry as pending until the next server acknowledgment', () => {
    const storage = storageFor({ [JOURNAL_STORAGE_KEY]: journal([{ id: 'j1', notes: 'A' }]) });
    markProfileBackedUp('did:plc:one', '2026-10-13T16:27:00Z', captureBrowserStorage(storage), storage);
    storage.setItem(JOURNAL_STORAGE_KEY, journal([{ id: 'j1', notes: 'A' }, { id: 'j2', notes: 'B' }]));
    expect(readProfileBackupView('did:plc:one', storage).pending.journal).toBe(true);
    const next = markProfileBackedUp('did:plc:one', '2026-10-13T16:28:00Z', captureBrowserStorage(storage), storage);
    expect(next?.summary).toBe('1 new journal entry');
    expect(readProfileBackupView('did:plc:one', storage).pending.journal).toBe(false);
  });

  it('notices inventory and customizer changes without calling them backed up', () => {
    const storage = storageFor({
      [JOURNAL_STORAGE_KEY]: journal([]),
      [INVENTORY_STORAGE_KEY]: inventory(1),
      'nvcApp.theme': '{"values":{"primary":"#ffffff"}}',
    });
    const prior = createProfileBackupReceipt('did:plc:one', '2026-10-13T16:27:00Z', captureBrowserStorage(storage), null);
    storage.setItem(INVENTORY_STORAGE_KEY, inventory(2));
    storage.setItem('nvcApp.theme', '{"values":{"primary":"#000000"}}');
    expect(readProfileBackupView('did:plc:one', storage).receipt).toBeNull();
    const result = createProfileBackupReceipt('did:plc:one', '2026-10-13T16:30:00Z', captureBrowserStorage(storage), prior);
    expect(result.summary).toContain('strategies updated');
    expect(result.summary).toContain('profile settings updated');
  });

  it('does not mistake profile receipt metadata for new profile data', () => {
    const storage = storageFor({ 'nvcApp.navSettings': '{}' });
    markProfileBackedUp('did:plc:one', '2026-10-13T16:27:00Z', captureBrowserStorage(storage), storage);
    expect(Object.keys(captureBrowserStorage(storage))).not.toContain(PROFILE_BACKUP_STATUS_KEY);
  });
});
