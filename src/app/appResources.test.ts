import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

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
});
