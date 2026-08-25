import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  OAUTH_CLIENT_METADATA,
  cloudflareCompatibleFetch,
  resolveBlueskyIdentity,
} from './oauth.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('keeps OAuth client metadata on one origin', () => {
  expect(new URL(OAUTH_CLIENT_METADATA.client_uri).origin)
    .toBe(new URL(OAUTH_CLIENT_METADATA.client_id).origin);
  expect(new URL(OAUTH_CLIENT_METADATA.redirect_uris[0]).origin)
    .toBe(new URL(OAUTH_CLIENT_METADATA.client_id).origin);
});

describe('cloudflareCompatibleFetch', () => {
  it('emulates redirect:error with Cloudflare-supported manual redirects', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await cloudflareCompatibleFetch('https://example.com/identity', {
      redirect: 'error',
    });

    expect(response.status).toBe(200);
    const [request] = fetchMock.mock.calls[0];
    expect(request).toBeInstanceOf(Request);
    expect(request.redirect).toBe('manual');
  });

  it('rebuilds Request inputs so Cloudflare never sees redirect:error', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const original = new Request('https://example.com/identity', {
      redirect: 'error',
    });
    await cloudflareCompatibleFetch(original);

    const [request] = fetchMock.mock.calls[0];
    expect(request).toBeInstanceOf(Request);
    expect(request).not.toBe(original);
    expect(request.redirect).toBe('manual');
  });

  it('still rejects an actual redirect', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, {
      status: 302,
      headers: { Location: 'https://example.com/elsewhere' },
    })));

    await expect(cloudflareCompatibleFetch('https://example.com/identity', {
      redirect: 'error',
    })).rejects.toThrow('Unexpected redirect');
  });
});

describe('resolveBlueskyIdentity', () => {
  it('requires the handle and DID document to agree', async () => {
    const did = 'did:plc:example123';
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ did }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: did,
        alsoKnownAs: ['at://person.example'],
        service: [],
      }), { status: 200 })));

    await expect(resolveBlueskyIdentity('Person.Example')).resolves.toMatchObject({
      did,
      handle: 'person.example',
    });
  });

  it('rejects a DID document that does not confirm the requested handle', async () => {
    const did = 'did:plc:example123';
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ did }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: did,
        alsoKnownAs: ['at://someone-else.example'],
        service: [],
      }), { status: 200 })));

    await expect(resolveBlueskyIdentity('person.example')).rejects.toThrow('does not confirm');
  });
});

