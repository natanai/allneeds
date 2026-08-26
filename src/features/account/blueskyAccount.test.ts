import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  extractProfileSnapshot,
  normalizeBlueskyHandle,
  resolveBlueskyHandle,
  saveCurrentBrowserToProfile,
} from './blueskyAccount';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Bluesky account compatibility', () => {
  it('normalizes the same handles accepted by the legacy sign-in form', () => {
    expect(normalizeBlueskyHandle(' @NatHanael.Ink ')).toBe('NatHanael.Ink');
    expect(() => normalizeBlueskyHandle('name')).toThrow(/include a domain/);
    expect(() => normalizeBlueskyHandle('name:bsky.social')).toThrow(/cannot include/);
    expect(() => normalizeBlueskyHandle('name@bsky.social')).toThrow(/no @/);
    expect(() => normalizeBlueskyHandle('name.bksy.social')).toThrow(/bsky.social/);
  });

  it('checks that a syntactically valid username exists before leaving allneeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      handle: 'canonical.bsky.social',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(resolveBlueskyHandle(' @Canonical.Bsky.Social ')).resolves.toBe('canonical.bsky.social');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('handle=Canonical.Bsky.Social');
  });

  it('turns a missing Bluesky username into a clear recoverable message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'error',
      message: 'Bluesky API returned 400',
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(resolveBlueskyHandle('typo.bsky.social')).rejects.toThrow(
      'We could not find that Bluesky username. Check the spelling and try again.',
    );
  });

  it('keeps temporary Bluesky lookup failures distinct from an invalid username', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(resolveBlueskyHandle('person.example')).rejects.toThrow(
      'We could not check that Bluesky username right now. Please try again.',
    );
  });

  it('extracts only the canonical profile snapshot setting', () => {
    const snapshot = { version: 1, localStorage: { example: 'saved' } };
    expect(extractProfileSnapshot({
      status: 'ok',
      settings: [{ key: 'something_else', value: '{}' }, { key: 'allneeds_export_v1', value: JSON.stringify(snapshot) }],
    })).toEqual(snapshot);
    expect(extractProfileSnapshot({ status: 'ok', settings: [{ key: 'allneeds_export_v1', value: '{bad' }] })).toBeNull();
    expect(extractProfileSnapshot({ status: 'error', settings: [] })).toBeNull();
  });

  it('reports the durable snapshot time before strategy reconciliation finishes', async () => {
    const values = new Map<string, string>();
    const storage = {
      get length() { return values.size; },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
    };
    vi.stubGlobal('window', {
      localStorage: storage,
      sessionStorage: storage,
      allneedsSession: {
        did: 'did:plc:profile-save-test',
        handle: 'person.example',
        verified: true,
        admin: false,
      },
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'ok',
        savedAt: '2026-08-25T20:01:02.345Z',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'ok',
        syncedAt: '2026-08-25T20:01:04.567Z',
        syncedCount: 0,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const progress = vi.fn();

    await expect(saveCurrentBrowserToProfile(progress)).resolves.toEqual({
      profileSavedAt: '2026-08-25T20:01:02.345Z',
      strategiesSynced: true,
      strategiesSyncedAt: '2026-08-25T20:01:04.567Z',
      strategyCount: 0,
    });
    expect(progress).toHaveBeenCalledWith({
      stage: 'syncing-strategies',
      profileSavedAt: '2026-08-25T20:01:02.345Z',
      strategyCount: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
