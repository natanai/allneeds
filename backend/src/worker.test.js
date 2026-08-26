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

function createSyncDatabase(initialRows, syncedRows) {
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
          return { results: sql.includes('s.client_key IS NOT NULL') ? syncedRows : initialRows };
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

  it('reconciles a multi-strategy profile through bounded batches instead of per-strategy round trips', async () => {
    const initialRows = [
      strategyRow({ id: 1, clientKey: 'one', title: 'One' }),
      strategyRow({ id: 2, clientKey: 'two', title: 'Two' }),
      strategyRow({ id: 3, clientKey: 'old', title: 'Old' }),
    ];
    const syncedRows = [
      strategyRow({ id: 1, clientKey: 'one', title: 'One updated' }),
      strategyRow({ id: 2, clientKey: 'two', title: 'Two updated' }),
      strategyRow({ id: 3, clientKey: 'old', title: 'Old' }),
    ];
    const database = createSyncDatabase(initialRows, syncedRows);
    const response = await worker.fetch(new Request(
      'https://backend.allneeds.app/api/strategies/sync-owned',
      {
        method: 'POST',
        headers: { Cookie: 'allneeds_session=session-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategies: [
            { clientKey: 'one', title: 'One updated', body: 'One updated body', needIds: ['safety'], visibility: 'public' },
            { clientKey: 'two', title: 'Two updated', body: 'Two updated body', needIds: ['safety'], visibility: 'followers' },
          ],
        }),
      },
    ), { DB: database.DB }, {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ status: 'ok', syncedCount: 2, unpublished: 1 });
    expect(Number.isNaN(Date.parse(data.syncedAt))).toBe(false);
    expect(database.reads).toHaveLength(2);
    expect(database.DB.batch).toHaveBeenCalledTimes(2);
    expect(database.DB.batch.mock.calls[0][0]).toHaveLength(2);
    expect(database.DB.batch.mock.calls[1][0]).toHaveLength(5);
  });
});
