import { describe, expect, it } from 'vitest';

import type { StorageDriver } from './storage';
import { readBrowseQuery, writeBrowseQuery } from './browseState';

function memoryStorage(): StorageDriver {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

describe('browse state', () => {
  it('keeps independent search queries for each browse page', () => {
    const storage = memoryStorage();
    writeBrowseQuery('feelings', 'calm', storage);
    writeBrowseQuery('needs', 'rest', storage);
    expect(readBrowseQuery('feelings', storage)).toBe('calm');
    expect(readBrowseQuery('needs', storage)).toBe('rest');
  });

  it('clears an empty page query without clearing the others', () => {
    const storage = memoryStorage();
    writeBrowseQuery('feelings', 'calm', storage);
    writeBrowseQuery('needs', 'rest', storage);
    writeBrowseQuery('feelings', '', storage);
    expect(readBrowseQuery('feelings', storage)).toBe('');
    expect(readBrowseQuery('needs', storage)).toBe('rest');
  });
});
