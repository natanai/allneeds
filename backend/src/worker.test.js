import { afterEach, describe, expect, it, vi } from 'vitest';

import worker from './worker.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Bluesky username lookup', () => {
  it('reports a missing profile as a user-correctable 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));

    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/resolve-handle?handle=typo.bsky.social',
    ), {}, {});

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      message: 'Bluesky profile not found',
    });
  });

  it('keeps an upstream outage distinct from a username typo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));

    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/resolve-handle?handle=person.example',
    ), {}, {});

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      message: 'Bluesky username check unavailable',
    });
  });
});

function strategyRow({ id, clientKey, title, visibility = 'public' }) {
  return {
    id,
    client_key: clientKey,
    author_did: 'did:plc:profile-sync-test',
    title,
    body: `${title} body`,
    need_ids: JSON.stringify(['safety']),
    contributor_name: null,
    contributor_location: null,
    created_at: '2026-08-25T12:00:00.000Z',
    updated_at: '2026-08-25T12:00:00.000Z',
    visibility,
    moderation_status: 'visible',
    add_count: 0,
    handle: 'person.example',
    display_name: 'Person',
    avatar_url: null,
  };
}

function createSyncDatabase(initialRows) {
  const reads = [];
  const prepare = vi.fn((sql) => ({
    bind(...values) {
      return {
        sql,
        values,
        async first() {
          if (sql.includes('FROM sessions')) {
            return {
              id: 'session-1',
              did: 'did:plc:profile-sync-test',
              expires_at: '2099-01-01T00:00:00.000Z',
              verified_at: '2026-08-25T12:00:00.000Z',
            };
          }
          return null;
        },
        async all() {
          reads.push(sql);
          return { results: initialRows };
        },
        async run() { return { meta: { changes: 1 } }; },
      };
    },
  }));
  return {
    reads,
    DB: {
      prepare,
      batch: vi.fn(async (statements) => statements.map(() => ({ success: true, meta: { changes: 1 } }))),
    },
  };
}

describe('profile persistence', () => {
  it('returns the authoritative profile snapshot save time', async () => {
    const savedValues = [];
    const env = {
      DB: {
        prepare: vi.fn((sql) => ({
          bind(...values) {
            return {
              async first() {
                if (sql.includes('FROM sessions')) {
                  return {
                    id: 'session-1',
                    did: 'did:plc:profile-sync-test',
                    expires_at: '2099-01-01T00:00:00.000Z',
                    verified_at: '2026-08-25T12:00:00.000Z',
                  };
                }
                return null;
              },
              async run() { savedValues.push(values); return { meta: { changes: 1 } }; },
            };
          },
        })),
      },
    };

    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/user-settings',
      {
        method: 'POST',
        headers: { Cookie: 'allneeds_session=session-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'allneeds_export_v1', value: '{}' }),
      },
    ), env, {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Number.isNaN(Date.parse(data.savedAt))).toBe(false);
    expect(savedValues[0]?.[3]).toBe(data.savedAt);
  });

  it('writes only changed and unpublished strategies from a complete profile snapshot', async () => {
    const initialRows = [
      strategyRow({ id: 1, clientKey: 'one', title: 'One' }),
      strategyRow({ id: 2, clientKey: 'two', title: 'Two' }),
      strategyRow({ id: 3, clientKey: 'old', title: 'Old' }),
    ];
    const database = createSyncDatabase(initialRows);
    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/strategies/sync-owned',
      {
        method: 'POST',
        headers: { Cookie: 'allneeds_session=session-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategies: [
            { clientKey: 'one', title: 'One', body: 'One body', needIds: ['safety'], visibility: 'public' },
            { clientKey: 'two', title: 'Two updated', body: 'Two updated body', needIds: ['safety'], visibility: 'followers' },
          ],
        }),
      },
    ), { DB: database.DB }, {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      status: 'ok',
      syncedCount: 2,
      changedCount: 1,
      unchangedCount: 1,
      unpublished: 1,
    });
    expect(Number.isNaN(Date.parse(data.syncedAt))).toBe(false);
    expect(database.reads).toHaveLength(1);
    expect(database.DB.batch).toHaveBeenCalledTimes(2);
    expect(database.DB.batch.mock.calls[0][0]).toHaveLength(1);
    expect(database.DB.batch.mock.calls[1][0]).toHaveLength(1);
  });

  it('performs no strategy writes when all 40 browser strategies are already current', async () => {
    const rows = Array.from({ length: 40 }, (_, index) => strategyRow({
      id: index + 1,
      clientKey: `strategy-${index + 1}`,
      title: `Strategy ${index + 1}`,
    }));
    const database = createSyncDatabase(rows);
    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/strategies/sync-owned',
      {
        method: 'POST',
        headers: { Cookie: 'allneeds_session=session-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategies: rows.map((row) => ({
            clientKey: row.client_key,
            title: row.title,
            body: row.body,
            needIds: ['safety'],
            visibility: row.visibility,
          })),
        }),
      },
    ), { DB: database.DB }, {});
    const data = await response.json();

    expect(data).toMatchObject({
      status: 'ok',
      syncedCount: 40,
      changedCount: 0,
      unchangedCount: 40,
      unpublished: 0,
    });
    expect(database.reads).toHaveLength(1);
    expect(database.DB.batch).not.toHaveBeenCalled();
  });

  it('rebuilds Need relationships only when a strategy Need set changes', async () => {
    const database = createSyncDatabase([
      strategyRow({ id: 1, clientKey: 'one', title: 'One' }),
    ]);
    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/strategies/sync-owned',
      {
        method: 'POST',
        headers: { Cookie: 'allneeds_session=session-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategies: [
            { clientKey: 'one', title: 'One', body: 'One body', needIds: ['safety', 'connection'], visibility: 'public' },
          ],
        }),
      },
    ), { DB: database.DB }, {});
    const data = await response.json();

    expect(data).toMatchObject({ changedCount: 1, unchangedCount: 0 });
    expect(database.DB.batch).toHaveBeenCalledTimes(2);
    expect(database.DB.batch.mock.calls[0][0]).toHaveLength(1);
    expect(database.DB.batch.mock.calls[1][0]).toHaveLength(3);
  });

  it('streams snapshot confirmation and strategy reconciliation through one profile request', async () => {
    const database = createSyncDatabase([]);
    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/profile/save',
      {
        method: 'POST',
        headers: { Cookie: 'allneeds_session=session-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'allneeds_export_v1', value: '{}', strategies: [] }),
      },
    ), { DB: database.DB }, {});
    const events = (await response.text()).trim().split('\n').map((line) => JSON.parse(line));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/x-ndjson');
    expect(events[0]).toMatchObject({ stage: 'profile-saved', status: 'ok', strategyCount: 0 });
    expect(events[1]).toMatchObject({
      stage: 'complete',
      status: 'ok',
      syncedCount: 0,
      changedCount: 0,
      unchangedCount: 0,
    });
    expect(events[0].savedAt).toBe(events[1].savedAt);
    expect(database.reads).toHaveLength(1);
  });
});

describe('public feed efficiency', () => {
  it('does not read a signed-in session for the identical public feed and allows browser caching', async () => {
    const statements = [];
    const env = {
      DB: {
        prepare: vi.fn((sql) => {
          statements.push(sql);
          return {
            bind() {
              return {
                async all() { return { results: [] }; },
                async first() { return null; },
              };
            },
          };
        }),
      },
    };
    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/strategies/feed?scope=public&sort=recent&limit=100',
      { headers: { Cookie: 'allneeds_session=session-1' } },
    ), env, {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ status: 'ok', scope: 'public', viewerDid: null, strategies: [] });
    expect(statements.some((sql) => sql.includes('FROM sessions'))).toBe(false);
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
  });
});
