import { describe, expect, it } from 'vitest';

import { BROWSER_BACKUP_VERSION, captureBrowserStorage, createBrowserBackup } from './browserBackup';

function memoryStorage(values: Record<string, string>) {
  const entries = Object.entries(values);
  return {
    get length() { return entries.length; },
    key(index: number) { return entries[index]?.[0] ?? null; },
    getItem(key: string) { return values[key] ?? null; },
  } as Storage;
}

describe('browser backups', () => {
  it('uses one versioned payload and excludes transient cache/session keys', () => {
    const storage = memoryStorage({
      inventory: 'kept',
      'allneeds:bsky-session-hint': 'private',
      'allneeds:shared-feed:public': 'cache',
    });

    expect(captureBrowserStorage(storage)).toEqual({ inventory: 'kept' });
    expect(captureBrowserStorage(storage, true)).toEqual({
      inventory: 'kept',
      'allneeds:bsky-session-hint': 'private',
      'allneeds:shared-feed:public': 'cache',
    });
    expect(createBrowserBackup(storage)).toMatchObject({
      version: BROWSER_BACKUP_VERSION,
      localStorage: { inventory: 'kept' },
    });
  });
});
