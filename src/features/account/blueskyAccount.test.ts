import { describe, expect, it } from 'vitest';

import { extractProfileSnapshot, normalizeBlueskyHandle } from './blueskyAccount';

describe('Bluesky account compatibility', () => {
  it('normalizes the same handles accepted by the legacy sign-in form', () => {
    expect(normalizeBlueskyHandle(' @NatHanael.Ink ')).toBe('NatHanael.Ink');
    expect(() => normalizeBlueskyHandle('name')).toThrow(/include a domain/);
    expect(() => normalizeBlueskyHandle('name:bsky.social')).toThrow(/cannot include/);
    expect(() => normalizeBlueskyHandle('name@bsky.social')).toThrow(/no @/);
    expect(() => normalizeBlueskyHandle('name.bksy.social')).toThrow(/bsky.social/);
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
