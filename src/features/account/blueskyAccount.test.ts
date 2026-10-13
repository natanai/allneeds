import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  extractProfileSnapshot,
  dismissProfileReview,
  loadProfileIntoCurrentBrowser,
  normalizeBlueskyHandle,
  resolveBlueskyHandle,
  saveCurrentBrowserToProfile,
} from './blueskyAccount';

afterEach(() => {
  dismissProfileReview();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('Bluesky account compatibility', () => {
  it('compares a saved profile after sign-in without replacing device entries or asking a destructive confirm', async () => {
    const values = new Map<string, string>([['allneeds.v2.journal', JSON.stringify({ schemaVersion: 1, data: { entries: [{ id: 'phone', dateISO: '2026-10-10T23:00:00Z', notes: 'My signed-out entry' }] } })]]);
    const localStorage = {
      get length() { return values.size; }, key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
      removeItem: vi.fn((key: string) => { values.delete(key); }), clear: vi.fn(),
    };
    const confirm = vi.fn();
    vi.stubGlobal('window', { localStorage, confirm, allneedsSession: { did: 'did:plc:review', handle: 'test.example', verified: true, admin: false } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok', settings: [{ key: 'allneeds_export_v1', value: JSON.stringify({ localStorage: {} }) }] }))));
    await expect(loadProfileIntoCurrentBrowser()).resolves.toBe('review');
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(localStorage.clear).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(values.get('allneeds.v2.journal')).toContain('My signed-out entry');
  });

  it.each([503, 401])('keeps local data when profile comparison fails with HTTP %s', async (status) => {
    const setItem = vi.fn();
    const clear = vi.fn();
    vi.stubGlobal('window', { localStorage: { setItem, clear }, allneedsSession: { did: 'did:plc:offline-review', verified: true } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
    await expect(loadProfileIntoCurrentBrowser()).rejects.toThrow('device data has been left in place');
    expect(setItem).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });

  it('restores a recently verified session without another backend call on page reload', async () => {
    vi.resetModules();
    const local = new Map<string, string>([['allneeds:bsky-session-hint', 'active']]);
    const session = new Map<string, string>([[
      'allneeds:bsky-session-cache-v1',
      JSON.stringify({
        version: 1,
        checkedAt: Date.now(),
        session: {
          did: 'did:plc:cached-session',
          handle: 'cached.example',
          verified: true,
          admin: false,
        },
      }),
    ]]);
    const storage = (values: Map<string, string>) => ({
      get length() { return values.size; },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
    });
    vi.stubGlobal('window', {
      localStorage: storage(local),
      sessionStorage: storage(session),
      location: { href: 'https://allneeds.app/' },
      history: { state: null, replaceState: vi.fn() },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const account = await import('./blueskyAccount');
    account.initializeBlueskyForCurrentPage();

    expect(account.getBlueskySession()).toMatchObject({
      did: 'did:plc:cached-session',
      verified: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

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
    values.set('kept-profile-setting', 'kept');
    values.set('allneeds:bsky-session-hint', 'active');
    values.set('allneeds:shared-feed:public-recent:v1', '{"transient":true}');
    values.set('nvc_rejected_emotions', '{"anxiety":4}');
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
    const encoder = new TextEncoder();
    const streamState: { controller?: ReadableStreamDefaultController<Uint8Array> } = {};
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        streamState.controller = controller;
        controller.enqueue(encoder.encode(`${JSON.stringify({
          stage: 'profile-saved',
          status: 'ok',
          savedAt: '2026-08-25T20:01:02.345Z',
          strategyCount: 0,
        })}\n`));
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(stream, {
      status: 200,
      headers: { 'Content-Type': 'application/x-ndjson' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const progress = vi.fn();

    const saving = saveCurrentBrowserToProfile(progress);
    await vi.waitFor(() => expect(progress).toHaveBeenCalledWith({
      stage: 'syncing-strategies',
      profileSavedAt: '2026-08-25T20:01:02.345Z',
      strategyCount: 0,
    }));
    streamState.controller?.enqueue(encoder.encode(`${JSON.stringify({
      stage: 'complete',
      status: 'ok',
      savedAt: '2026-08-25T20:01:02.345Z',
      syncedAt: '2026-08-25T20:01:04.567Z',
      syncedCount: 0,
      changedCount: 0,
      unchangedCount: 0,
      unpublished: 0,
    })}\n`));
    streamState.controller?.close();

    await expect(saving).resolves.toEqual({
      profileSavedAt: '2026-08-25T20:01:02.345Z',
      strategiesSynced: true,
      strategiesSyncedAt: '2026-08-25T20:01:04.567Z',
      strategyCount: 0,
      changedStrategyCount: 0,
      unchangedStrategyCount: 0,
      unpublishedStrategyCount: 0,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/profile/save');
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestBody = JSON.parse(String(request.body)) as { value: string };
    const profileSnapshot = JSON.parse(requestBody.value) as { localStorage: Record<string, string> };
    expect(profileSnapshot.localStorage).toEqual({ 'kept-profile-setting': 'kept' });
  });
  it('automatically backs up a journal change without discarding cloud-only entries or settings', async () => {
    const journal = (entries: Array<{ id: string; notes: string }>) => JSON.stringify({
      schemaVersion: 1, savedAt: '2026-10-13T16:00:00Z', data: {
        entries: entries.map((entry) => ({ ...entry, dateISO: '2026-10-13T16:00:00Z' })),
      },
    });
    const values = new Map<string, string>([
      ['allneeds.v2.journal', journal([{ id: 'local-entry', notes: 'Saved locally' }])],
      ['nvcApp.theme', '{"version":"newer-local-change"}'],
    ]);
    const localStorage = {
      get length() { return values.size; },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
    };
    vi.stubGlobal('window', { localStorage, sessionStorage: localStorage, allneedsSession: {
      did: 'did:plc:journal-auto-test', handle: 'journal.example', verified: true, admin: false,
    } });
    const existing = { version: 1, localStorage: {
      'allneeds.v2.journal': journal([{ id: 'cloud-entry', notes: 'Saved on another device' }]),
      'nvcApp.theme': '{"version":"cloud-preference"}',
    } };
    let upload: Record<string, unknown> | null = null;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith('/user-settings')) {
        return new Response(JSON.stringify({
          status: 'ok', settings: [{ key: 'allneeds_export_v1', value: JSON.stringify(existing) }],
        }), { status: 200 });
      }
      if (String(url).endsWith('/profile/save')) {
        upload = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response([
          JSON.stringify({ stage: 'profile-saved', status: 'ok', savedAt: '2026-10-13T16:31:00Z', strategyCount: 0 }),
          JSON.stringify({ stage: 'complete', status: 'ok', savedAt: '2026-10-13T16:31:00Z', syncedAt: '2026-10-13T16:31:01Z', syncedCount: 0, changedCount: 0, unchangedCount: 0, unpublished: 0 }),
          '',
        ].join('\\n'), { status: 200 });
      }
      throw new Error('Unexpected request');
    });
    vi.stubGlobal('fetch', fetchMock);
    await saveCurrentBrowserToProfile(undefined, 'journal-auto');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(upload).not.toBeNull();
    const saved = JSON.parse(String(upload!.value)) as { localStorage: Record<string, string> };
    const record = JSON.parse(saved.localStorage['allneeds.v2.journal']!) as { data: { entries: Array<{ id: string }> } };
    expect(record.data.entries.map((entry) => entry.id).sort()).toEqual(['cloud-entry', 'local-entry']);
    expect(saved.localStorage['nvcApp.theme']).toBe('{"version":"cloud-preference"}');
    expect(values.get('nvcApp.theme')).toBe('{"version":"newer-local-change"}');

    const { readProfileBackupView } = await import('./profileBackupStatus');
    const status = readProfileBackupView('did:plc:journal-auto-test', localStorage as Storage);
    expect(status.receipt?.journalCount).toBe(1);
    expect(status.pending.journal).toBe(false);
    expect(status.pending.settings).toBe(true);
  });

});
