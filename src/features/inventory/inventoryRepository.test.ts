import { describe, expect, it } from 'vitest';

import type { StorageDriver } from '../../persistence/storage';
import {
  INVENTORY_STORAGE_KEY,
  createPersonalInventoryEntry,
  isDuplicateStrategy,
  readInventory,
  writeInventory,
} from './inventoryRepository';

class MemoryStorage implements StorageDriver {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('inventoryRepository', () => {
  it('imports the legacy flat inventory once into the versioned V2 store and keeps old entries private from Nat exports', () => {
    const storage = new MemoryStorage();
    storage.setItem('nvcApp.inventory', JSON.stringify([{
      id: 'legacy-1',
      title: 'Call a friend',
      description: 'Reach out.',
      needSlug: 'love-caring',
      needSlugs: ['love-caring'],
      tags: ['love-caring'],
      createdAt: '2025-01-01T00:00:00.000Z',
      personal: false,
      visibility: 'private',
    }]));

    expect(readInventory(storage)[0]).toMatchObject({
      title: 'Call a friend',
      shareWithNat: false,
    });
    expect(JSON.parse(storage.getItem(INVENTORY_STORAGE_KEY) ?? '{}')).toMatchObject({
      schemaVersion: 1,
      data: { items: [{ title: 'Call a friend', needSlugs: ['love-caring'], shareWithNat: false }] },
    });
  });

  it('round-trips a personal strategy, defaults Nat sharing off, and detects title/need duplicates', () => {
    const storage = new MemoryStorage();
    const entry = createPersonalInventoryEntry({
      title: '  Take a walk  ',
      description: 'Step outside.',
      needSlugs: ['rest', 'space'],
      needTitle: 'Rest',
    });
    writeInventory([entry], storage);

    expect(readInventory(storage)[0]).toMatchObject({
      title: 'Take a walk',
      personal: true,
      shareWithNat: false,
      needSlugs: ['rest', 'space'],
    });
    expect(isDuplicateStrategy([entry], 'take a WALK', ['space'])).toBe(true);
    expect(isDuplicateStrategy([entry], 'Take a walk', ['connection'])).toBe(false);
  });

  it('stores explicit consent to include a personal strategy in Nat exports independently of Bluesky visibility', () => {
    const entry = createPersonalInventoryEntry({
      title: 'Tea on the porch',
      description: 'Make tea and sit outside.',
      needSlugs: ['rest'],
      needTitle: 'Rest',
      shareWithNat: true,
      visibility: 'private',
    });
    expect(entry).toMatchObject({ shareWithNat: true, visibility: 'private' });
  });
});
