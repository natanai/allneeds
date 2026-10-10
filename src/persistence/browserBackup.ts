import { isTransientLocalStorageKey } from './transientStorage';

export const BROWSER_BACKUP_VERSION = 1;

export function captureBrowserStorage(storage: Storage, includeTransient = false) {
  const snapshot: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && (includeTransient || !isTransientLocalStorageKey(key))) {
      snapshot[key] = storage.getItem(key) ?? '';
    }
  }
  return snapshot;
}

export function createBrowserBackup(storage: Storage = window.localStorage) {
  return {
    version: BROWSER_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    localStorage: captureBrowserStorage(storage),
  };
}

export function downloadBrowserBackup(snapshot = captureBrowserStorage(window.localStorage), filename = 'allneeds-browser-backup') {
  const blob = new Blob([JSON.stringify({ version: BROWSER_BACKUP_VERSION, exportedAt: new Date().toISOString(), localStorage: snapshot }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().replace(/:/g, '-')}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function restoreBrowserBackup(file: File) {
  const parsed: unknown = JSON.parse(await file.text());
  const snapshot = parsed && typeof parsed === 'object' && 'localStorage' in parsed
    ? (parsed as { localStorage?: unknown }).localStorage
    : null;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('Invalid backup');
  }
  if (!window.confirm('Replace this browser’s current allneeds data with the selected backup?')) {
    return { status: 'canceled' as const };
  }

  const previous = captureBrowserStorage(window.localStorage, true);
  const transient = Object.fromEntries(Object.entries(previous).filter(([key]) => isTransientLocalStorageKey(key)));
  try {
    window.localStorage.clear();
    Object.entries(snapshot).forEach(([key, value]) => {
      if (!isTransientLocalStorageKey(key)) {
        window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    });
    Object.entries(transient).forEach(([key, value]) => window.localStorage.setItem(key, value));
  } catch (error) {
    window.localStorage.clear();
    Object.entries(previous).forEach(([key, value]) => window.localStorage.setItem(key, value));
    throw error;
  }
  return { status: 'restored' as const, snapshot: snapshot as Record<string, unknown> };
}
