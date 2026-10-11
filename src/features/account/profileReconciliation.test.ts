import { afterEach, describe, expect, it, vi } from 'vitest';

import { captureBrowserStorage, createBrowserBackup } from '../../persistence/browserBackup';
import { createPersonalInventoryEntry, INVENTORY_STORAGE_KEY, readInventory } from '../inventory/inventoryRepository';
import { createJournalRecord, JOURNAL_STORAGE_KEY, readJournal } from '../journal/journalRepository';
import { applyCombinedProfile, applyProfileReplacement, combineProfileSnapshots, compareProfileSnapshots, localProfileRisk, PROFILE_RECOVERY_STORAGE_KEY, profileHasDifferences, readProfileRecovery, type BrowserSnapshot } from './profileReconciliation';

afterEach(() => vi.unstubAllGlobals());

function storage(initial: BrowserSnapshot = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  } satisfies Storage;
}

function journal(id: string, notes: string) {
  return { ...createJournalRecord({ notes, feelings: [{ feeling: 'Anxiety', intensity: 3 }], needs: ['safety'], tags: ['work'] }), id, dateISO: '2026-10-10T23:00:00.000Z' };
}

function snapshot(entries: ReturnType<typeof journal>[] = [], extras: BrowserSnapshot = {}): BrowserSnapshot {
  return { [JOURNAL_STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-10T23:00:00Z', data: { entries } }), ...extras };
}

describe('profile reconciliation', () => {
  it('keeps recovery lookup usable when browser storage is restricted', () => {
    vi.stubGlobal('window', Object.defineProperty({}, 'localStorage', { get() { throw new Error('Storage unavailable'); } }));
    expect(readProfileRecovery()).toBeNull();
  });

  it('reads the recovery copy when a full storage quota prevents even probe writes', () => {
    const device = snapshot([journal('phone', 'Protected entry')]);
    const profile = snapshot([]);
    const driver = storage(device);
    applyCombinedProfile(driver, compareProfileSnapshots(device, profile), 'device', 'did:plc:test');
    driver.setItem = () => { throw new Error('Quota exceeded'); };
    vi.stubGlobal('window', { localStorage: driver });
    expect(readProfileRecovery()).toEqual({ device, profile });
  });
  it('keeps the entry written while signed out and all account-only entries', () => {
    const device = snapshot([journal('old', 'Already in both'), journal('phone', 'Written on my phone')]);
    const profile = snapshot([journal('old', 'Already in both'), journal('account', 'From the other device')]);
    const review = compareProfileSnapshots(device, profile);
    expect(review.journal.deviceOnly.map((item) => item.id)).toEqual(['phone']);
    expect(review.journal.profileOnly.map((item) => item.id)).toEqual(['account']);
    expect(review.journal.matching).toBe(1);
    const combined = combineProfileSnapshots(review, 'device');
    expect(readJournal(storage(combined)).map((item) => item.notes).sort()).toEqual(['Already in both', 'From the other device', 'Written on my phone']);
    expect(device).not.toEqual(combined);
  });

  it('only flags local journal and strategy records that profile replacement would remove', () => {
    const localEdit = journal('changed', 'Local edit');
    const device = snapshot([journal('local', 'Local only'), localEdit]);
    const profile = snapshot([journal('remote', 'Profile only'), { ...localEdit, notes: 'Profile edit' }]);
    const comparison = compareProfileSnapshots(device, profile);
    expect(localProfileRisk(comparison)).toEqual({ journalEntries: 2, strategies: 0 });
  });

  it('replaces browser data with the profile while preserving drafts, sign-in state, and a recovery copy', () => {
    const device = snapshot([journal('phone', 'Phone entry')], {
      'browser-only-setting': 'remove me',
      'allneeds.v2.journal.draft': 'unfinished local draft',
    });
    const profile = snapshot([journal('account', 'Account entry')], {
      'profile-setting': 'load me',
      'allneeds.v2.journal.draft': 'stale account draft',
    });
    const driver = storage({ ...device, 'allneeds:bsky-session-hint': 'active' });
    applyProfileReplacement(driver, compareProfileSnapshots(device, profile), 'did:plc:test');
    expect(readJournal(driver).map((item) => item.notes)).toEqual(['Account entry']);
    expect(driver.getItem('browser-only-setting')).toBeNull();
    expect(driver.getItem('profile-setting')).toBe('load me');
    expect(driver.getItem('allneeds.v2.journal.draft')).toBe('unfinished local draft');
    expect(driver.getItem('allneeds:bsky-session-hint')).toBe('active');
    expect(readProfileRecovery(driver)).toEqual({ device, profile });
  });

  it('preserves two differently edited versions without multiplying copies on repeated loads', () => {
    const device = snapshot([journal('entry', 'Edited on the phone')]);
    const profile = snapshot([journal('entry', 'Edited on the other device')]);
    const review = compareProfileSnapshots(device, profile);
    expect(review.journal.conflicts).toHaveLength(1);
    const first = combineProfileSnapshots(review, 'device');
    const second = combineProfileSnapshots(compareProfileSnapshots(first, profile), 'device');
    const records = readJournal(storage(second));
    expect(records).toHaveLength(2);
    expect(new Set(records.map((entry) => entry.id)).size).toBe(2);
    expect(records.find((entry) => entry.id === 'entry')?.notes).toBe('Edited on the phone');
    expect(records.map((entry) => entry.feelings)).toEqual([[{ feeling: 'Anxiety', intensity: 3 }], [{ feeling: 'Anxiety', intensity: 3 }]]);
  });

  it('does not mistake envelope timestamps or object property order for content changes', () => {
    const device = snapshot([journal('same', 'Same entry')], { 'nvcApp.theme': '{"preset":"default","updatedAt":1}' });
    const profile = snapshot([journal('same', 'Same entry')], { 'nvcApp.theme': '{"updatedAt":2,"preset":"default"}' });
    profile[JOURNAL_STORAGE_KEY] = profile[JOURNAL_STORAGE_KEY]!.replace('2026-10-10T23:00:00Z', '2026-10-10T23:01:00Z');
    expect(profileHasDifferences(compareProfileSnapshots(device, profile))).toBe(false);
  });

  it('keeps exactly two conflicting journal versions when a combined profile reaches the other device', () => {
    const phone = snapshot([journal('entry', 'Phone version')]);
    const laptop = snapshot([journal('entry', 'Laptop version')]);
    const saved = combineProfileSnapshots(compareProfileSnapshots(phone, laptop), 'device');
    const onLaptop = combineProfileSnapshots(compareProfileSnapshots(laptop, saved), 'device');
    expect(readJournal(storage(onLaptop)).map((item) => item.notes).sort()).toEqual(['Laptop version', 'Phone version']);
  });

  it('imports older journal entries with stable IDs and preserves repeated entries with distinct IDs', () => {
    const older = { 'journal:v2': JSON.stringify([{ timestamp: Date.parse('2026-01-01T12:00:00Z'), notes: 'Older entry' }]) };
    const first = combineProfileSnapshots(compareProfileSnapshots({}, older), 'device');
    const second = combineProfileSnapshots(compareProfileSnapshots(first, older), 'device');
    expect(readJournal(storage(second))).toHaveLength(1);
    const identicalText = combineProfileSnapshots(compareProfileSnapshots(snapshot([journal('one', 'Same words')]), snapshot([journal('two', 'Same words')])), 'device');
    expect(readJournal(storage(identicalText))).toHaveLength(2);
  });

  it('lets profile settings replace local settings while preserving unfinished local drafts', () => {
    const device = snapshot([], { 'nvcApp.theme': '{"preset":"blue"}', 'only-here': 'kept', 'allneeds.v2.journal.draft': 'device draft' });
    const profile = snapshot([], { 'nvcApp.theme': '{"preset":"default"}', 'only-profile': 'also kept', 'allneeds.v2.journal.draft': 'profile draft' });
    const review = compareProfileSnapshots(device, profile);
    expect(combineProfileSnapshots(review, 'device')['nvcApp.theme']).toBe('{"preset":"blue"}');
    const combined = combineProfileSnapshots(review, 'profile');
    expect(combined['nvcApp.theme']).toBe('{"preset":"default"}');
    expect(combined['only-here']).toBeUndefined();
    expect(combined['only-profile']).toBe('also kept');
    expect(combined['allneeds.v2.journal.draft']).toBe('device draft');
  });

  it('retains inventory-only entries and keeps a conflicting strategy copy private', () => {
    const item = { ...createPersonalInventoryEntry({ title: 'Phone version', description: 'Phone description', needSlugs: ['safety'], needTitle: 'Safety', visibility: 'public' }), id: 'strategy' };
    const wire = (items: typeof item[]) => JSON.stringify({ schemaVersion: 1, savedAt: '', data: { items } });
    const device = snapshot([], { [INVENTORY_STORAGE_KEY]: wire([item]) });
    const profile = snapshot([], { [INVENTORY_STORAGE_KEY]: wire([{ ...item, title: 'Account version' }, { ...item, id: 'other', title: 'Account-only strategy' }]) });
    const review = compareProfileSnapshots(device, profile);
    const first = combineProfileSnapshots(review, 'device');
    const second = combineProfileSnapshots(compareProfileSnapshots(first, profile), 'device');
    const items = readInventory(storage(second));
    expect(items).toHaveLength(3);
    expect(items.find((entry) => entry.title === 'Account version')).toMatchObject({ visibility: 'private', shareWithNat: false });
    expect(items.find((entry) => entry.id === 'strategy')?.visibility).toBe('public');
  });

  it('saves both originals before applying and excludes recovery data from future profile snapshots', () => {
    const device = snapshot([journal('phone', 'Phone entry')]);
    const profile = snapshot([journal('account', 'Account entry')]);
    const driver = storage({ ...device, 'allneeds:bsky-session-hint': 'active' });
    applyCombinedProfile(driver, compareProfileSnapshots(device, profile), 'device', 'did:plc:test');
    expect(readProfileRecovery(driver)).toEqual({ device, profile });
    expect(readJournal(driver)).toHaveLength(2);
    expect(driver.getItem('allneeds:bsky-session-hint')).toBe('active');
    expect(createBrowserBackup(driver).localStorage[PROFILE_RECOVERY_STORAGE_KEY]).toBeUndefined();
  });

  it('leaves all current data untouched when there is no room for the recovery copy', () => {
    const device = snapshot([journal('phone', 'Phone entry')]);
    const driver = storage(device);
    const set = driver.setItem;
    driver.setItem = (key, value) => { if (key === PROFILE_RECOVERY_STORAGE_KEY) throw new Error('Quota exceeded'); set(key, value); };
    expect(() => applyCombinedProfile(driver, compareProfileSnapshots(device, snapshot()), 'profile', 'did:plc:test')).toThrow('Quota exceeded');
    expect(captureBrowserStorage(driver)).toEqual(device);
  });

  it('rolls back every changed value when a later write fails, retaining the recovery copy', () => {
    const device = snapshot([journal('phone', 'Phone entry')]);
    const profile = snapshot([journal('account', 'Account entry')], { 'new-setting': 'remote' });
    const driver = storage(device);
    const set = driver.setItem;
    let failed = false;
    driver.setItem = (key, value) => { if (key === INVENTORY_STORAGE_KEY && !failed) { failed = true; throw new Error('Storage write failed'); } set(key, value); };
    expect(() => applyCombinedProfile(driver, compareProfileSnapshots(device, profile), 'profile', 'did:plc:test')).toThrow('Storage write failed');
    expect(captureBrowserStorage(driver)).toEqual(device);
    expect(readProfileRecovery(driver)).toEqual({ device, profile });
  });

  it('refuses to overwrite data changed during the review', () => {
    const device = snapshot([journal('phone', 'Original')]);
    const driver = storage(snapshot([journal('phone', 'Just edited')]));
    expect(() => applyCombinedProfile(driver, compareProfileSnapshots(device, snapshot()), 'device', 'did:plc:test')).toThrow('changed while you were reviewing');
    expect(readJournal(driver)[0]?.notes).toBe('Just edited');
    expect(readProfileRecovery(driver)).toBeNull();
  });

  it.each(['{broken', '{"schemaVersion":2,"data":{"entries":[]}}', '{"schemaVersion":1,"data":{"entries":[null]}}'])('blocks unreadable/future data instead of treating it as empty: %s', (raw) => {
    expect(() => compareProfileSnapshots(snapshot(), { [JOURNAL_STORAGE_KEY]: raw })).toThrow();
    expect(() => compareProfileSnapshots({ [JOURNAL_STORAGE_KEY]: raw }, snapshot())).toThrow();
  });
});
