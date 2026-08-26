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
