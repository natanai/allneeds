import { describe, expect, it } from 'vitest';

import type { StorageDriver } from './storage';
import { VersionedStore } from './versionedStore';

class MemoryStorage implements StorageDriver {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

interface Settings {
  reducedMotion: boolean;
}

const isSettings = (value: unknown): value is Settings =>
  typeof value === 'object' &&
  value !== null &&
  'reducedMotion' in value &&
  typeof value.reducedMotion === 'boolean';

describe('VersionedStore', () => {
  it('round-trips validated data inside an explicit schema envelope', () => {
    const storage = new MemoryStorage();
    const store = new VersionedStore<Settings>({
      key: 'allneeds.v2.settings',
      schemaVersion: 1,
      storage,
      validate: isSettings,
      now: () => new Date('2026-08-17T22:30:00.000Z'),
    });

    store.write({ reducedMotion: true });

    expect(store.read()).toEqual({
      status: 'ready',
      value: { reducedMotion: true },
      savedAt: '2026-08-17T22:30:00.000Z',
    });
  });

  it('does not silently interpret data written by a different schema version', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'allneeds.v2.settings',
      JSON.stringify({ schemaVersion: 2, savedAt: '2026-08-17T22:30:00.000Z', data: { reducedMotion: false } }),
    );

    const store = new VersionedStore<Settings>({
      key: 'allneeds.v2.settings',
      schemaVersion: 1,
      storage,
      validate: isSettings,
    });

    expect(store.read()).toEqual({ status: 'unsupported', foundVersion: 2, supportedVersion: 1 });
  });

  it('reports malformed persisted data rather than replacing it implicitly', () => {
    const storage = new MemoryStorage();
    storage.setItem('allneeds.v2.settings', '{ definitely not json');

    const store = new VersionedStore<Settings>({
      key: 'allneeds.v2.settings',
      schemaVersion: 1,
      storage,
      validate: isSettings,
    });

    expect(store.read().status).toBe('invalid');
    expect(storage.getItem('allneeds.v2.settings')).toBe('{ definitely not json');
  });
});
