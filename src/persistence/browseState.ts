import { getBrowserSessionStorage } from './storage';
import type { StorageDriver } from './storage';
import { VersionedStore } from './versionedStore';

export const BROWSE_STATE_STORAGE_KEY = 'allneeds.v2.browse-state';

type BrowseState = {
  queries: Record<string, string>;
};

function isBrowseState(value: unknown): value is BrowseState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const queries = (value as { queries?: unknown }).queries;
  return typeof queries === 'object'
    && queries !== null
    && !Array.isArray(queries)
    && Object.values(queries).every((query) => typeof query === 'string');
}

function browseStore(storage: StorageDriver | null) {
  return new VersionedStore<BrowseState>({
    key: BROWSE_STATE_STORAGE_KEY,
    schemaVersion: 1,
    storage,
    validate: isBrowseState,
  });
}

export function readBrowseQuery(
  page: string,
  storage: StorageDriver | null = getBrowserSessionStorage(),
) {
  const result = browseStore(storage).read();
  return result.status === 'ready' ? result.value.queries[page] ?? '' : '';
}

export function writeBrowseQuery(
  page: string,
  query: string,
  storage: StorageDriver | null = getBrowserSessionStorage(),
) {
  const store = browseStore(storage);
  const current = store.read();
  const queries = current.status === 'ready' ? { ...current.value.queries } : {};
  const bounded = query.slice(0, 160);
  if (bounded) queries[page] = bounded;
  else delete queries[page];
  try {
    if (Object.keys(queries).length) store.write({ queries });
    else store.clear();
  } catch {
    // Search remains fully functional when session storage is restricted.
  }
  return bounded;
}
