export interface StorageDriver {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function getBrowserStorage(): StorageDriver | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = window.localStorage;
    const probe = '__allneeds_v2_storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function getBrowserSessionStorage(): StorageDriver | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = window.sessionStorage;
    const probe = '__allneeds_v2_session_storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
