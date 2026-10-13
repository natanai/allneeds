import { captureBrowserStorage } from '../../persistence/browserBackup';
import { LEGACY_STORAGE_KEYS } from '../../persistence/legacy/keys';
import type { StorageDriver } from '../../persistence/storage';
import { isTransientLocalStorageKey } from '../../persistence/transientStorage';
import { INVENTORY_STORAGE_KEY, readInventory, type InventoryStrategy } from '../inventory/inventoryRepository';
import { JOURNAL_STORAGE_KEY, readJournal, type JournalRecord } from '../journal/journalRepository';

export const PROFILE_RECOVERY_STORAGE_KEY = 'allneeds:profile-recovery-v1';
export type BrowserSnapshot = Record<string, string>;
export type SettingsSource = 'device' | 'profile';

type CollectionComparison<T> = {
  device: T[];
  profile: T[];
  deviceOnly: T[];
  profileOnly: T[];
  conflicts: Array<{ device: T; profile: T }>;
  matching: number;
};

export type ProfileComparison = {
  device: BrowserSnapshot;
  profile: BrowserSnapshot;
  journal: CollectionComparison<JournalRecord>;
  inventory: CollectionComparison<InventoryStrategy>;
  settingKeys: string[];
};

export type LocalProfileRisk = {
  journalEntries: number;
  strategies: number;
};

const collectionKeys = new Set<string>([
  JOURNAL_STORAGE_KEY, INVENTORY_STORAGE_KEY, LEGACY_STORAGE_KEYS.inventory,
  LEGACY_STORAGE_KEYS.journalCurrent, LEGACY_STORAGE_KEYS.journalLegacy, LEGACY_STORAGE_KEYS.alexithymiaJournal,
]);

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (record(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

function settingValue(raw: string | undefined) {
  if (raw === undefined) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (record(value)) {
      const { savedAt: _savedAt, updatedAt: _updatedAt, ...content } = value;
      return stable(content);
    }
    return stable(value);
  } catch { return raw; }
}

function isDraft(key: string) {
  return key.startsWith('allneeds.v2.') && (key.endsWith('.draft') || key.includes('.draft.'));
}

export function snapshotStorage(snapshot: BrowserSnapshot): StorageDriver {
  const values = { ...snapshot };
  for (const key of collectionKeys) {
    if (key === JOURNAL_STORAGE_KEY || key === INVENTORY_STORAGE_KEY || values[key] === undefined) continue;
    const parsed: unknown = JSON.parse(values[key]!);
    const entries = Array.isArray(parsed) ? parsed : record(parsed) && Array.isArray(parsed.entries) ? parsed.entries : [];
    const normalized = entries.map((entry: unknown) => record(entry) && !entry.id ? { ...entry, id: copyId(`legacy-${key}`, entry) } : entry);
    values[key] = JSON.stringify(Array.isArray(parsed) ? normalized : { ...(record(parsed) ? parsed : {}), entries: normalized });
  }
  return {
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => { values[key] = value; },
    removeItem: (key) => { delete values[key]; },
  };
}

export function profileBrowserSnapshot(value: unknown): BrowserSnapshot {
  if (!record(value)) throw new Error('The saved profile does not contain readable browser data.');
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !isTransientLocalStorageKey(key))
    .map(([key, entry]) => [key, typeof entry === 'string' ? entry : JSON.stringify(entry)]));
}

function validateCollection(snapshot: BrowserSnapshot, key: string, field: string) {
  const raw = snapshot[key];
  if (raw === undefined) return;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Some journal or inventory data is unreadable. Download a backup before continuing.'); }
  if (!record(value) || value.schemaVersion !== 1 || !record(value.data) || !Array.isArray(value.data[field])) {
    throw new Error('Some journal or inventory data uses an unsupported format. Your device data has been left in place.');
  }
  const valid = value.data[field].every((item) => record(item) && typeof item.id === 'string' && Boolean(item.id)
    && (field === 'entries'
      ? typeof item.notes === 'string' && typeof item.dateISO === 'string' && !Number.isNaN(Date.parse(item.dateISO))
      : typeof item.title === 'string' && Boolean(item.title.trim()) && typeof item.description === 'string'
        && Array.isArray(item.needSlugs) && Array.isArray(item.tags) && typeof item.createdAt === 'string'));
  const ids = value.data[field].map((item: unknown) => record(item) ? item.id : null);
  if (!valid || new Set(ids).size !== ids.length) throw new Error('Some journal or inventory entries are unreadable. Your device data has been left in place.');
}

function readableLegacyEntry(entry: unknown, inventory: boolean) {
  if (!record(entry)) return false;
  if (inventory) return typeof entry.title === 'string' && Boolean(entry.title.trim());
  const date = entry.dateISO ?? entry.timestamp ?? entry.createdAt ?? entry.date ?? entry.savedAt;
  return typeof (entry.notes ?? entry.text ?? entry.entry ?? '') === 'string'
    && (typeof date === 'number' || typeof date === 'string') && !Number.isNaN(new Date(date).getTime());
}

function compareCollection<T extends { id: string }>(device: T[], profile: T[]): CollectionComparison<T> {
  const deviceById = new Map(device.map((item) => [item.id, item]));
  const profileById = new Map(profile.map((item) => [item.id, item]));
  const conflicts: Array<{ device: T; profile: T }> = [];
  let matching = 0;
  profile.forEach((item) => {
    const local = deviceById.get(item.id);
    if (!local) return;
    if (stable(local) === stable(item)) matching += 1;
    else conflicts.push({ device: local, profile: item });
  });
  return {
    device, profile, conflicts, matching,
    deviceOnly: device.filter((item) => !profileById.has(item.id)),
    profileOnly: profile.filter((item) => !deviceById.has(item.id)),
  };
}

export function compareProfileSnapshots(device: BrowserSnapshot, profile: BrowserSnapshot): ProfileComparison {
  for (const snapshot of [device, profile]) {
    validateCollection(snapshot, JOURNAL_STORAGE_KEY, 'entries');
    validateCollection(snapshot, INVENTORY_STORAGE_KEY, 'items');
    // Validate compatibility sources before the repository adapter reads them.
    for (const key of collectionKeys) {
      if (key === JOURNAL_STORAGE_KEY || key === INVENTORY_STORAGE_KEY || snapshot[key] === undefined) continue;
      let value: unknown;
      try { value = JSON.parse(snapshot[key]!); } catch { throw new Error('Older journal or inventory data is unreadable. Download a backup before continuing.'); }
      if (!Array.isArray(value) && !(record(value) && Array.isArray(value.entries))) {
        throw new Error('Older journal or inventory data is unreadable. Your device data has been left in place.');
      }
      const entries = Array.isArray(value) ? value : (value as { entries: unknown[] }).entries;
      if (!entries.every((entry: unknown) => readableLegacyEntry(entry, key === LEGACY_STORAGE_KEYS.inventory))) {
        throw new Error('Older journal or inventory entries are unreadable. Your device data has been left in place.');
      }
    }
  }
  return {
    device, profile,
    journal: compareCollection(readJournal(snapshotStorage(device)), readJournal(snapshotStorage(profile))),
    inventory: compareCollection(readInventory(snapshotStorage(device)), readInventory(snapshotStorage(profile))),
    settingKeys: [...new Set([...Object.keys(device), ...Object.keys(profile)])]
      .filter((key) => !collectionKeys.has(key) && !isTransientLocalStorageKey(key) && !isDraft(key))
      .filter((key) => settingValue(device[key]) !== settingValue(profile[key])),
  };
}

export function profileHasDifferences(comparison: ProfileComparison) {
  return Boolean(comparison.settingKeys.length || comparison.journal.deviceOnly.length || comparison.journal.profileOnly.length
    || comparison.journal.conflicts.length || comparison.inventory.deviceOnly.length || comparison.inventory.profileOnly.length
    || comparison.inventory.conflicts.length);
}

export function localProfileRisk(comparison: ProfileComparison): LocalProfileRisk {
  return {
    journalEntries: comparison.journal.deviceOnly.length + comparison.journal.conflicts.length,
    strategies: comparison.inventory.deviceOnly.length + comparison.inventory.conflicts.length,
  };
}

function copyId(id: string, content: unknown) {
  let hash = 2166136261;
  for (const char of stable(content)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${id}~profile-${(hash >>> 0).toString(16)}`;
}

function mergeCollection<T extends { id: string }>(comparison: CollectionComparison<T>, privateCopy?: (item: T) => T) {
  const merged = [...comparison.device];
  const used = new Map(merged.map((item) => [item.id, item]));
  const contentKey = (item: T) => {
    const { id, ...content } = item;
    return `${id.split('~profile-')[0]}:${stable(content)}`;
  };
  const knownContent = new Set(merged.map(contentKey));
  comparison.profile.forEach((item) => {
    // Once a combined snapshot travels to another device, its conflict copy may
    // represent that device's original. Match within this ID family only.
    if (knownContent.has(contentKey(item))) return;
    const existing = used.get(item.id);
    if (!existing) { merged.push(item); used.set(item.id, item); knownContent.add(contentKey(item)); return; }
    if (stable(existing) === stable(item)) return;
    const copy = { ...(privateCopy ? privateCopy(item) : item), id: copyId(item.id, item) };
    // A deterministic conflict copy is retained once on subsequent reviews.
    let suffix = 1;
    const baseId = copy.id;
    while (used.has(copy.id) && stable(used.get(copy.id)) !== stable(copy)) copy.id = `${baseId}-${suffix++}`;
    if (!used.has(copy.id)) { merged.push(copy); used.set(copy.id, copy); knownContent.add(contentKey(copy)); }
  });
  return merged;
}

export function combineProfileSnapshots(comparison: ProfileComparison, settings: SettingsSource): BrowserSnapshot {
  const result = settings === 'profile'
    ? { ...comparison.profile }
    : { ...comparison.profile, ...comparison.device };
  // In-progress work on this device always survives an account load.
  Object.entries(comparison.device).forEach(([key, value]) => { if (isDraft(key)) result[key] = value; });
  const savedAt = new Date().toISOString();
  result[JOURNAL_STORAGE_KEY] = JSON.stringify({ schemaVersion: 1, savedAt, data: { entries: mergeCollection(comparison.journal) } });
  result[INVENTORY_STORAGE_KEY] = JSON.stringify({ schemaVersion: 1, savedAt, data: {
    items: mergeCollection(comparison.inventory, (item) => ({ ...item, visibility: 'private' as const, shareWithNat: false })),
  } });
  return result;
}

export function applyCombinedProfile(storage: Storage, comparison: ProfileComparison, settings: SettingsSource, did: string) {
  const previous = captureBrowserStorage(storage, true);
  const current = captureBrowserStorage(storage);
  if (stable(current) !== stable(comparison.device)) {
    throw new Error('Data on this device changed while you were reviewing. Review the latest differences before combining.');
  }
  const combined = combineProfileSnapshots(comparison, settings);
  // Write a recoverable copy BEFORE touching any current data; abort if storage is full.
  const recovery = JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), data: {
    did, device: comparison.device, profile: comparison.profile,
  } });
  storage.setItem(PROFILE_RECOVERY_STORAGE_KEY, recovery);
  const touched: string[] = [];
  try {
    for (const key of Object.keys(comparison.device)) {
      if (isTransientLocalStorageKey(key) || isDraft(key) || combined[key] !== undefined) continue;
      touched.push(key);
      storage.removeItem(key);
    }
    for (const [key, value] of Object.entries(combined)) {
      if (isTransientLocalStorageKey(key) || storage.getItem(key) === value) continue;
      touched.push(key);
      storage.setItem(key, value);
    }
  } catch (error) {
    for (const key of touched.reverse()) {
      if (previous[key] === undefined) storage.removeItem(key);
      else storage.setItem(key, previous[key]!);
    }
    throw error;
  }
  return combined;
}

export function applyProfileReplacement(storage: Storage, comparison: ProfileComparison, did: string) {
  const previous = captureBrowserStorage(storage, true);
  const current = captureBrowserStorage(storage);
  if (stable(current) !== stable(comparison.device)) {
    throw new Error('Data on this device changed while you were deciding. Check the saved profile again.');
  }

  const replacement = { ...comparison.profile };
  // Drafts belong to the browser where they were started. Never load stale
  // profile drafts or discard current work as part of an account sign-in.
  Object.keys(replacement).forEach((key) => { if (isDraft(key)) delete replacement[key]; });
  Object.entries(comparison.device).forEach(([key, value]) => { if (isDraft(key)) replacement[key] = value; });

  const recovery = JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), data: {
    did, device: comparison.device, profile: comparison.profile,
  } });
  storage.setItem(PROFILE_RECOVERY_STORAGE_KEY, recovery);

  const touched = new Set<string>();
  try {
    for (const key of Object.keys(comparison.device)) {
      if (isTransientLocalStorageKey(key) || isDraft(key) || replacement[key] !== undefined) continue;
      touched.add(key);
      storage.removeItem(key);
    }
    for (const [key, value] of Object.entries(replacement)) {
      if (isTransientLocalStorageKey(key) || storage.getItem(key) === value) continue;
      touched.add(key);
      storage.setItem(key, value);
    }
  } catch (error) {
    for (const key of [...touched].reverse()) {
      if (previous[key] === undefined) storage.removeItem(key);
      else storage.setItem(key, previous[key]!);
    }
    throw error;
  }
  return replacement;
}

export function readProfileRecovery(storage?: StorageDriver | null) {
  try {
    // Recovery must remain readable even when a storage quota prevents new writes.
    const driver = storage === undefined ? (typeof window === 'undefined' ? null : window.localStorage) : storage;
    if (!driver) return null;
    const value: unknown = JSON.parse(driver.getItem(PROFILE_RECOVERY_STORAGE_KEY) ?? 'null');
    if (!record(value) || value.schemaVersion !== 1 || !record(value.data)) return null;
    return { device: profileBrowserSnapshot(value.data.device), profile: profileBrowserSnapshot(value.data.profile) };
  } catch { return null; }
}
