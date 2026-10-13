import { captureBrowserStorage } from '../../persistence/browserBackup';
import { INVENTORY_STORAGE_KEY } from '../inventory/inventoryRepository';
import { JOURNAL_STORAGE_KEY } from '../journal/journalRepository';

export const PROFILE_BACKUP_STATUS_KEY = 'allneeds:profile-backup-status-v1';
export const PROFILE_BACKUP_STATUS_CHANGED_EVENT = 'allneeds:profile-backup-status-changed';

export type ProfileBackupReceipt = {
  version: 1;
  did: string;
  savedAt: string;
  journalCount: number;
  strategyCount: number;
  journalDigest: string;
  inventoryDigest: string;
  settingsDigest: string;
  journalIds: Record<string, string>;
  summary: string;
};

type BrowserSnapshot = Record<string, string>;
type BackupChanges = { journal: boolean; inventory: boolean; settings: boolean };
export type ProfileBackupView = {
  receipt: ProfileBackupReceipt | null;
  pending: BackupChanges;
};

function digest(value: string) {
  // Two separate 32-bit rolling hashes and the length; metadata never duplicates private content.
  let a = 2166136261;
  let b = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    a = Math.imul(a ^ code, 16777619);
    b = Math.imul(b ^ code, 3266489917);
  }
  return `${value.length}:${(a >>> 0).toString(16)}:${(b >>> 0).toString(16)}`;
}

function entriesFromSnapshot(snapshot: BrowserSnapshot) {
  try {
    const stored: unknown = JSON.parse(snapshot[JOURNAL_STORAGE_KEY] ?? 'null');
    const wire = stored as { data?: { entries?: unknown[] } } | null;
    return Array.isArray(wire?.data?.entries) ? wire.data.entries : [];
  } catch { return []; }
}

function itemsFromSnapshot(snapshot: BrowserSnapshot) {
  try {
    const stored: unknown = JSON.parse(snapshot[INVENTORY_STORAGE_KEY] ?? 'null');
    const wire = stored as { data?: { items?: unknown[] } } | null;
    return Array.isArray(wire?.data?.items) ? wire.data.items : [];
  } catch { return []; }
}

export function journalEntryDigest(entry: unknown) {
  return digest(JSON.stringify(entry));
}

function journalIds(snapshot: BrowserSnapshot): Record<string, string> {
  const ids: Record<string, string> = {};
  for (const item of entriesFromSnapshot(snapshot)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const id = (item as { id?: unknown }).id;
    if (typeof id === 'string' && id) ids[id] = journalEntryDigest(item);
  }
  return ids;
}

function settings(snapshot: BrowserSnapshot) {
  // Only durable user preferences matter here, not route history or unfinished drafts.
  return Object.keys(snapshot).filter((key) =>
    key === 'nvcApp.theme' || key === 'nvcApp.navSettings' || key.startsWith('magnetPositions:'),
  ).sort().map((key) => [key, snapshot[key]]);
}

function signatures(snapshot: BrowserSnapshot) {
  return {
    journal: digest(snapshot[JOURNAL_STORAGE_KEY] ?? ''),
    inventory: digest(snapshot[INVENTORY_STORAGE_KEY] ?? ''),
    settings: digest(JSON.stringify(settings(snapshot))),
  };
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function summaryFor(snapshot: BrowserSnapshot, previous: ProfileBackupReceipt | null) {
  const currentIds = journalIds(snapshot);
  const previousIds = previous?.journalIds ?? {};
  const created = Object.keys(currentIds).filter((id) => !(id in previousIds)).length;
  const changed = Object.keys(currentIds).filter((id) => id in previousIds && currentIds[id] !== previousIds[id]).length;
  const removed = Object.keys(previousIds).filter((id) => !(id in currentIds)).length;
  const signaturesNow = signatures(snapshot);
  const parts = [
    created ? `${plural(created, 'new journal entry', 'new journal entries')}` : '',
    changed ? `${plural(changed, 'updated journal entry', 'updated journal entries')}` : '',
    removed ? `${plural(removed, 'removed journal entry', 'removed journal entries')}` : '',
    previous && previous.inventoryDigest !== signaturesNow.inventory ? 'strategies updated' : '',
    previous && previous.settingsDigest !== signaturesNow.settings ? 'profile settings updated' : '',
  ].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return previous ? 'profile backup refreshed' : 'initial profile backup';
}

export function createProfileBackupReceipt(did: string, savedAt: string, snapshot: BrowserSnapshot, previous: ProfileBackupReceipt | null): ProfileBackupReceipt {
  const sig = signatures(snapshot);
  return {
    version: 1, did, savedAt,
    journalCount: entriesFromSnapshot(snapshot).length,
    strategyCount: itemsFromSnapshot(snapshot).length,
    journalDigest: sig.journal,
    inventoryDigest: sig.inventory,
    settingsDigest: sig.settings,
    journalIds: journalIds(snapshot),
    summary: summaryFor(snapshot, previous),
  };
}

export function readProfileBackupReceipt(did: string, storage: Pick<Storage, 'getItem'> | null = typeof window === 'undefined' ? null : window.localStorage): ProfileBackupReceipt | null {
  if (!did || !storage) return null;
  try {
    const value: unknown = JSON.parse(storage.getItem(PROFILE_BACKUP_STATUS_KEY) ?? 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const parsed = value as Partial<ProfileBackupReceipt>;
    if (parsed.version !== 1 || parsed.did !== did || typeof parsed.savedAt !== 'string'
      || !Number.isFinite(Date.parse(parsed.savedAt)) || typeof parsed.summary !== 'string'
      || typeof parsed.journalDigest !== 'string' || typeof parsed.inventoryDigest !== 'string'
      || typeof parsed.settingsDigest !== 'string' || !parsed.journalIds || typeof parsed.journalIds !== 'object'
      || typeof parsed.journalCount !== 'number' || typeof parsed.strategyCount !== 'number') return null;
    return parsed as ProfileBackupReceipt;
  } catch { return null; }
}

export function readProfileBackupView(did: string, storage: Storage = window.localStorage): ProfileBackupView {
  const receipt = readProfileBackupReceipt(did, storage);
  const sig = signatures(captureBrowserStorage(storage));
  return {
    receipt,
    pending: {
      journal: !receipt || receipt.journalDigest !== sig.journal,
      inventory: !receipt || receipt.inventoryDigest !== sig.inventory,
      settings: !receipt || receipt.settingsDigest !== sig.settings,
    },
  };
}

export function markProfileBackedUp(did: string, savedAt: string, snapshot: BrowserSnapshot, storage: Storage = window.localStorage) {
  if (!did) return;
  const receipt = createProfileBackupReceipt(did, savedAt, snapshot, readProfileBackupReceipt(did, storage));
  // This is a display receipt, not the backup itself. A quota error must not undo a server save.
  try { storage.setItem(PROFILE_BACKUP_STATUS_KEY, JSON.stringify(receipt)); } catch { /* The profile is already durable. */ }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(PROFILE_BACKUP_STATUS_CHANGED_EVENT));
  }
  return receipt;
}
