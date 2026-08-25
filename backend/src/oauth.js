import { NodeOAuthClient } from '@atproto/oauth-client-node';

const BACKEND_ORIGIN = 'https://backend.allneeds.app';
const APP_ORIGIN = 'https://allneeds.app';
const OAUTH_STATE_TTL_SECONDS = 15 * 60;
const ALLNEEDS_SESSION_TTL_DAYS = 30;

export async function cloudflareCompatibleFetch(input, init = undefined) {
  const inputRedirect = input && typeof input === 'object'
    && typeof input.redirect === 'string'
    ? input.redirect
    : undefined;
  const requestedRedirect = init?.redirect
    ?? inputRedirect;
  if (requestedRedirect !== 'error') return fetch(input, init);

  const request = input && typeof input === 'object' && typeof input.url === 'string'
    ? new Request(input.url, {
      method: init?.method ?? input.method,
      headers: init?.headers ?? input.headers,
      signal: init?.signal ?? input.signal,
      cache: init?.cache ?? input.cache,
      redirect: 'manual',
    })
    : new Request(input, { ...init, redirect: 'manual' });
  const response = await fetch(request);
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel().catch(() => undefined);
    throw new TypeError('Unexpected redirect while resolving OAuth metadata');
  }
  return response;
}

function didDocumentUrl(did) {
  if (did.startsWith('did:plc:')) {
    return new URL(`/${encodeURIComponent(did)}`, 'https://plc.directory');
  }
  if (!did.startsWith('did:web:')) throw new Error('Unsupported AT Protocol DID method');

  const segments = did.slice('did:web:'.length).split(':').map((segment) => decodeURIComponent(segment));
  const hostname = segments.shift()?.toLowerCase() || '';
  if (!hostname.includes('.')
    || hostname === 'localhost'
    || hostname.endsWith('.local')
    || /^\d+(?:\.\d+){3}$/.test(hostname)
    || hostname.includes(':')) {
    throw new Error('Unsafe did:web hostname');
  }
  const url = new URL(`https://${hostname}`);
  url.pathname = segments.length
    ? `/${segments.map((segment) => encodeURIComponent(segment)).join('/')}/did.json`
    : '/.well-known/did.json';
  return url;
}

export async function resolveBlueskyIdentity(identifier, { signal } = {}) {
  const handle = normalizeHandle(identifier);
  if (!handle || !handle.includes('.') || !/^[a-z0-9.-]+$/.test(handle)) {
    throw new Error('Valid Bluesky handle is required');
  }

  const resolveUrl = new URL('https://bsky.social/xrpc/com.atproto.identity.resolveHandle');
  resolveUrl.searchParams.set('handle', handle);
  const handleResponse = await cloudflareCompatibleFetch(resolveUrl, {
    headers: { Accept: 'application/json' },
    redirect: 'manual',
    signal,
  });
  if (!handleResponse.ok) throw new Error('Bluesky handle could not be resolved');
  const handlePayload = await handleResponse.json();
  const did = typeof handlePayload?.did === 'string' ? handlePayload.did : '';
  if (!did.startsWith('did:plc:') && !did.startsWith('did:web:')) {
    throw new Error('Bluesky returned an invalid DID');
  }

  const documentResponse = await cloudflareCompatibleFetch(didDocumentUrl(did), {
    headers: { Accept: 'application/did+ld+json, application/json' },
    redirect: 'manual',
    signal,
  });
  if (!documentResponse.ok) throw new Error('Bluesky DID document could not be resolved');
  const didDoc = await documentResponse.json();
  if (!didDoc || typeof didDoc !== 'object' || didDoc.id !== did) {
    throw new Error('Bluesky DID document does not match the resolved DID');
  }
  const aliases = Array.isArray(didDoc.alsoKnownAs) ? didDoc.alsoKnownAs : [];
  if (!aliases.some((value) => typeof value === 'string'
    && value.toLowerCase() === `at://${handle}`)) {
    throw new Error('Bluesky DID document does not confirm the requested handle');
  }

  return { did, didDoc, handle };
}

export const OAUTH_CLIENT_METADATA = {
  client_id: `${BACKEND_ORIGIN}/oauth-client-metadata.json`,
  client_name: 'allneeds.app',
  client_uri: BACKEND_ORIGIN,
  redirect_uris: [`${BACKEND_ORIGIN}/auth/callback`],
  grant_types: ['authorization_code', 'refresh_token'],
  scope: 'atproto',
  response_types: ['code'],
  application_type: 'web',
  token_endpoint_auth_method: 'none',
  dpop_bound_access_tokens: true,
};

function d1JsonStore(env, table, keyColumn, { expires = false } = {}) {
  return {
    async set(key, value) {
      const serialized = JSON.stringify(value);
      if (expires) {
        await env.DB.prepare(
          `INSERT INTO ${table} (${keyColumn}, value, expires_at, created_at)
           VALUES (?, ?, datetime('now', ?), CURRENT_TIMESTAMP)
           ON CONFLICT(${keyColumn}) DO UPDATE SET
             value = excluded.value,
             expires_at = excluded.expires_at,
             created_at = CURRENT_TIMESTAMP;`,
        ).bind(key, serialized, `+${OAUTH_STATE_TTL_SECONDS} seconds`).run();
      } else {
        await env.DB.prepare(
          `INSERT INTO ${table} (${keyColumn}, value, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(${keyColumn}) DO UPDATE SET
             value = excluded.value,
             updated_at = CURRENT_TIMESTAMP;`,
        ).bind(key, serialized).run();
      }
    },
    async get(key) {
      const row = await env.DB.prepare(
        `SELECT value${expires ? ', expires_at' : ''} FROM ${table} WHERE ${keyColumn} = ? LIMIT 1;`,
      ).bind(key).first();
      if (!row) return undefined;
      if (expires && row.expires_at && Date.parse(`${row.expires_at}Z`) <= Date.now()) {
        await this.del(key);
        return undefined;
      }
      try {
        return JSON.parse(row.value);
      } catch {
        await this.del(key);
        return undefined;
      }
    },
    async del(key) {
      await env.DB.prepare(`DELETE FROM ${table} WHERE ${keyColumn} = ?;`).bind(key).run();
    },
  };
}

function createOAuthClient(env) {
  return new NodeOAuthClient({
    clientMetadata: OAUTH_CLIENT_METADATA,
    fetch: cloudflareCompatibleFetch,
    identityResolver: { resolve: resolveBlueskyIdentity },
    // Supplying this prevents the Node client from eagerly constructing its
    // unused Node-only DNS/SSRF resolver before honoring identityResolver.
    handleResolver: 'https://bsky.social',
    stateStore: d1JsonStore(env, 'oauth_states', 'key', { expires: true }),
    sessionStore: d1JsonStore(env, 'oauth_sessions', 'did'),
  });
}

function safeReturnPath(value) {
  if (typeof value !== 'string') return '/inventory/';
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/inventory/';
  try {
    const resolved = new URL(trimmed, APP_ORIGIN);
    return resolved.origin === APP_ORIGIN ? `${resolved.pathname}${resolved.search}${resolved.hash}` : '/inventory/';
  } catch {
    return '/inventory/';
  }
}

function normalizeHandle(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^@/, '').toLowerCase();
}

async function upsertVerifiedUser(env, did) {
  const profileUrl = new URL('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile');
  profileUrl.searchParams.set('actor', did);
  const response = await fetch(profileUrl, { headers: { Accept: 'application/json' } }).catch(() => null);
  const profile = response?.ok ? await response.json().catch(() => null) : null;
  const handle = profile?.did === did && typeof profile.handle === 'string' ? profile.handle : did;
  const displayName = profile?.did === did && typeof profile.displayName === 'string' ? profile.displayName : null;
  const avatar = profile?.did === did && typeof profile.avatar === 'string' ? profile.avatar : null;

  await env.DB.prepare(
    `INSERT INTO users (did, handle, display_name, avatar_url, created_at, last_login_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(did) DO UPDATE SET
       handle = excluded.handle,
       display_name = COALESCE(excluded.display_name, users.display_name),
       avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
       last_login_at = CURRENT_TIMESTAMP;`,
  ).bind(did, handle, displayName, avatar).run();

  return { did, handle: handle === did ? null : handle };
}

async function createVerifiedAllneedsSession(env, did) {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO sessions
       (id, did, access_token, access_token_expires_at, created_at, expires_at, verified_at)
     VALUES (?, ?, NULL, NULL, CURRENT_TIMESTAMP, datetime('now', ?), CURRENT_TIMESTAMP);`,
  ).bind(id, did, `+${ALLNEEDS_SESSION_TTL_DAYS} days`).run();
  return id;
}

export async function beginVerifiedLogin(request, env) {
  const url = new URL(request.url);
  const handle = normalizeHandle(url.searchParams.get('handle'));
  if (!handle || !handle.includes('.') || !/^[a-z0-9.-]+$/.test(handle)) {
    return { error: 'valid Bluesky handle is required', status: 400 };
  }
  const returnTo = safeReturnPath(url.searchParams.get('returnTo'));
  const client = createOAuthClient(env);
  const authorizationUrl = await client.authorize(handle, {
    scope: 'atproto',
    state: returnTo,
  });
  return { redirect: authorizationUrl.toString() };
}

export async function finishVerifiedLogin(request, env) {
  const url = new URL(request.url);
  const client = createOAuthClient(env);
  const { session, state } = await client.callback(url.searchParams, {
    redirect_uri: OAUTH_CLIENT_METADATA.redirect_uris[0],
  });

  const did = session.did;
  const profile = await upsertVerifiedUser(env, did);
  const sessionId = await createVerifiedAllneedsSession(env, did);

  // allneeds only needs the verified DID. Revoke and remove the short-lived AT Protocol
  // credential immediately instead of retaining Bluesky access/refresh tokens in D1.
  await session.signOut();

  const destination = new URL(safeReturnPath(state), APP_ORIGIN);
  destination.searchParams.set('auth', 'verified');
  return {
    redirect: destination.toString(),
    sessionId,
    profile,
  };
}

