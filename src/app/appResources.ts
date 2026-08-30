export type SharedFeedStrategy = {
  id: string | number;
  authorDid?: string;
  clientKey?: string | null;
  title?: string;
  body?: string;
  createdAt?: string;
  updatedAt?: string;
  visibility?: 'private' | 'followers' | 'public';
  addCount?: number;
  needIds?: unknown[];
  supportsNeeds?: unknown[];
  needs?: unknown[];
  contributor?: { name?: string | null; location?: string | null } | null;
  author?: { displayName?: string; handle?: string; did?: string };
};

export type SharedFeedResources = {
  strategies: SharedFeedStrategy[];
  error: string;
};

export const SHARED_FEED_FRESH_MS = 60 * 60 * 1_000;
const PUBLIC_FEED_STORAGE_KEY = 'allneeds:shared-feed:public-recent:v1';

const feedResources = new Map<string, SharedFeedResources>();
const feedPromises = new Map<string, Promise<SharedFeedResources>>();
const feedFetchedAt = new Map<string, number>();
const feedReadyKeys = new Set<string>();

function feedKey(scope: string, sort: string) {
  return `${scope}:${sort}`;
}

function safeLocalStorage() {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

function hydratePersistedPublicFeed() {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    const parsed: unknown = JSON.parse(storage.getItem(PUBLIC_FEED_STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
    const persisted = parsed as { version?: unknown; fetchedAt?: unknown; strategies?: unknown };
    if (persisted.version !== 1 || typeof persisted.fetchedAt !== 'number' || !Array.isArray(persisted.strategies)) return;
    const key = feedKey('public', 'recent');
    feedResources.set(key, { strategies: persisted.strategies as SharedFeedStrategy[], error: '' });
    feedFetchedAt.set(key, persisted.fetchedAt);
    const age = Date.now() - persisted.fetchedAt;
    if (age >= 0 && age <= SHARED_FEED_FRESH_MS) feedReadyKeys.add(key);
  } catch {
    // Corrupt or unavailable optional cache falls back to the normal best-effort request.
  }
}

function persistPublicFeed(key: string, strategies: SharedFeedStrategy[], fetchedAt: number) {
  if (key !== feedKey('public', 'recent')) return;
  try {
    safeLocalStorage()?.setItem(PUBLIC_FEED_STORAGE_KEY, JSON.stringify({
      version: 1,
      fetchedAt,
      strategies,
    }));
  } catch {
    // Public strategy persistence is an optimization; memory caching still works.
  }
}

hydratePersistedPublicFeed();

export function readSharedFeedResources(scope: string, sort: string) {
  return feedResources.get(feedKey(scope, sort)) ?? null;
}

export function readSharedFeedUpdatedAt(scope: string, sort: string) {
  const value = feedFetchedAt.get(feedKey(scope, sort));
  return typeof value === 'number' ? new Date(value).toISOString() : null;
}

export function loadSharedFeedResources(scope: string, sort: string, refresh = false) {
  const key = feedKey(scope, sort);
  if (!refresh && feedResources.has(key) && feedReadyKeys.has(key)) {
    return Promise.resolve(feedResources.get(key)!);
  }
  if (feedPromises.has(key)) return feedPromises.get(key)!;
  const base = import.meta.env.DEV ? '/allneeds-api' : 'https://backend.allneeds.app/api';
  const promise = fetch(`${base}/strategies/feed?scope=${encodeURIComponent(scope)}&sort=${encodeURIComponent(sort)}&limit=100`, {
    credentials: 'include',
    cache: refresh ? 'reload' : 'default',
  }).then(async (response) => {
    const data: unknown = await response.json();
    if (!response.ok || !data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') {
      throw new Error('Unable to load shared strategies right now.');
    }
    const strategies = Array.isArray((data as { strategies?: unknown }).strategies)
      ? (data as { strategies: SharedFeedStrategy[] }).strategies
      : [];
    const result = { strategies, error: '' };
    const fetchedAt = Date.now();
    feedResources.set(key, result);
    feedFetchedAt.set(key, fetchedAt);
    feedReadyKeys.add(key);
    persistPublicFeed(key, strategies, fetchedAt);
    return result;
  }).catch(() => {
    const cached = feedResources.get(key);
    return {
      strategies: cached?.strategies ?? [],
      error: 'Unable to load shared strategies right now.',
    };
  }).finally(() => {
    feedPromises.delete(key);
  });
  feedPromises.set(key, promise);
  return promise;
}

export async function warmAppResources() {
  await loadSharedFeedResources('public', 'recent');
}
