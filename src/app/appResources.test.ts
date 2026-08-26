import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.useRealTimers();
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    storage: {
      get length() { return values.size; },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
    },
  };
}

describe('shared strategy resources', () => {
  it('does not cache a failed feed request so a later feature open can retry', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          strategies: [{ id: 1, title: 'Recovered strategy', visibility: 'public' }],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const resources = await import('./appResources');
    const first = await resources.loadSharedFeedResources('public', 'recent');

    expect(first.error).toBe('Unable to load shared strategies right now.');
    expect(resources.readSharedFeedResources('public', 'recent')).toBeNull();

    const second = await resources.loadSharedFeedResources('public', 'recent');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(second.error).toBe('');
    expect(second.strategies).toHaveLength(1);
    expect(resources.readSharedFeedResources('public', 'recent')?.strategies[0]?.title)
      .toBe('Recovered strategy');
  });

  it('reuses a successful public feed snapshot instead of refetching for each need page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        strategies: [{ id: 2, title: 'Cached strategy', visibility: 'public' }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const resources = await import('./appResources');
    const first = await resources.loadSharedFeedResources('public', 'recent');
    const second = await resources.loadSharedFeedResources('public', 'recent');

    expect(first).toBe(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('joins an in-flight startup request even when Refresh is pressed before it finishes', async () => {
    const pending: { resolve?: (value: { ok: boolean; json: () => Promise<unknown> }) => void } = {};
    const fetchMock = vi.fn(() => new Promise<{ ok: boolean; json: () => Promise<unknown> }>((resolve) => {
      pending.resolve = resolve;
    }));
    vi.stubGlobal('fetch', fetchMock);

    const resources = await import('./appResources');
    const startup = resources.loadSharedFeedResources('public', 'recent');
    const refresh = resources.loadSharedFeedResources('public', 'recent', true);
    expect(startup).toBe(refresh);
    expect(fetchMock).toHaveBeenCalledOnce();

    pending.resolve?.({
      ok: true,
      json: async () => ({ status: 'ok', strategies: [] }),
    });
    await expect(refresh).resolves.toEqual({ strategies: [], error: '' });
  });

  it('reuses a fresh persisted public snapshot across full application reloads', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T05:00:00.000Z'));
    const local = memoryStorage();
    vi.stubGlobal('window', { localStorage: local.storage });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        strategies: [{ id: 3, title: 'Persisted strategy', visibility: 'public' }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const firstRuntime = await import('./appResources');
    await firstRuntime.loadSharedFeedResources('public', 'recent');
    expect(fetchMock).toHaveBeenCalledOnce();

    vi.resetModules();
    const reloadedRuntime = await import('./appResources');
    const restored = await reloadedRuntime.loadSharedFeedResources('public', 'recent');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(restored.strategies[0]?.title).toBe('Persisted strategy');
    expect(reloadedRuntime.readSharedFeedUpdatedAt('public', 'recent')).toBe('2026-08-26T05:00:00.000Z');
  });

  it('lets explicit Refresh bypass a fresh persisted public snapshot', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T05:00:00.000Z'));
    const local = memoryStorage();
    local.storage.setItem('allneeds:shared-feed:public-recent:v1', JSON.stringify({
      version: 1,
      fetchedAt: Date.now(),
      strategies: [{ id: 4, title: 'Cached strategy', visibility: 'public' }],
    }));
    vi.stubGlobal('window', { localStorage: local.storage });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        strategies: [{ id: 5, title: 'New strategy', visibility: 'public' }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const resources = await import('./appResources');
    await resources.loadSharedFeedResources('public', 'recent');
    expect(fetchMock).not.toHaveBeenCalled();

    const refreshed = await resources.loadSharedFeedResources('public', 'recent', true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ cache: 'reload' });
    expect(refreshed.strategies[0]?.title).toBe('New strategy');
  });
});
