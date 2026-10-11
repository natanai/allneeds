import { afterEach, describe, expect, it, vi } from 'vitest';

const PENDING_KEY = 'allneeds:home-screen-sign-in-v1';

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    storage: {
      get length() { return values.size; },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
    } satisfies Storage,
  };
}

function browserWindow(localStorage: Storage, sessionStorage: Storage, href = 'https://allneeds.app/inventory/journal') {
  const assign = vi.fn();
  return {
    localStorage,
    sessionStorage,
    location: { href, assign },
    navigator: { standalone: true },
    crypto: globalThis.crypto,
    btoa: globalThis.btoa,
    matchMedia: vi.fn(() => ({ matches: true })),
    history: { state: null, replaceState: vi.fn() },
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    allneedsSession: null,
    assign,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('iOS home-screen sign-in continuity', () => {
  it('keeps the claim secret in the originating app while sending only its proof through OAuth', async () => {
    const local = storage();
    const session = storage();
    const browser = browserWindow(local.storage, session.storage);
    vi.stubGlobal('window', browser);
    vi.stubGlobal('navigator', browser.navigator);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      handle: 'person.example',
    }), { status: 200 })));

    const account = await import('./blueskyAccount');
    await account.signInWithBluesky('person.example');

    const pending = JSON.parse(local.values.get(PENDING_KEY) ?? '{}') as { handoff?: string; secret?: string };
    const loginUrl = new URL(String(browser.assign.mock.calls[0]?.[0]));
    expect(pending.handoff).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(pending.secret).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(loginUrl.searchParams.get('handoff')).toBe(pending.handoff);
    expect(loginUrl.searchParams.get('proof')).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(loginUrl.toString()).not.toContain(String(pending.secret));
  });

  it('claims the verified session back in the original app before comparing its journal', async () => {
    const handoff = 'A'.repeat(43);
    const secret = 'B'.repeat(43);
    const journal = JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-10-11T01:00:00.000Z',
      data: { entries: [{ id: 'phone-entry', dateISO: '2026-10-11T01:00:00.000Z', notes: 'Still in the app' }] },
    });
    const local = storage({
      [PENDING_KEY]: JSON.stringify({ version: 1, handoff, secret, createdAt: Date.now() }),
      'allneeds.v2.journal': journal,
    });
    const session = storage({ 'allneeds:bsky-login-intent': '1' });
    const browser = browserWindow(local.storage, session.storage);
    vi.stubGlobal('window', browser);
    vi.stubGlobal('navigator', browser.navigator);
    vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: vi.fn() });
    const signedIn = { status: 'ok', signedIn: true, did: 'did:plc:home-screen', handle: 'person.example', verified: true, admin: false };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/handoff/claim')) return new Response(JSON.stringify(signedIn), { status: 200 });
      if (url.endsWith('/api/me')) return new Response(JSON.stringify(signedIn), { status: 200 });
      if (url.endsWith('/api/user-settings')) return new Response(JSON.stringify({ status: 'ok', settings: [] }), { status: 200 });
      return new Response('{}', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const account = await import('./blueskyAccount');
    account.initializeBlueskyForCurrentPage();
    await account.resumeHomeScreenSignIn('123456');

    await vi.waitFor(() => expect(account.getBlueskySession()?.did).toBe('did:plc:home-screen'));
    await vi.waitFor(() => expect(local.values.has(PENDING_KEY)).toBe(false));
    expect(local.values.get('allneeds.v2.journal')).toBe(journal);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      'https://backend.allneeds.app/auth/handoff/claim',
      'https://backend.allneeds.app/api/me',
      'https://backend.allneeds.app/api/user-settings',
    ]);
  });
});
