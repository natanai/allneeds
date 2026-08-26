import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  extractProfileSnapshot,
  normalizeBlueskyHandle,
  resolveBlueskyHandle,
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
});
