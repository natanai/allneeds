import strategyWorker from './worker.js';
import {
  OAUTH_CLIENT_METADATA,
  beginVerifiedLogin,
  finishVerifiedLogin,
} from './oauth.js';

const APP_ORIGIN = 'https://allneeds.app';

function errorDetails(error) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const cause = error.cause && typeof error.cause === 'object'
    ? {
      name: typeof error.cause.name === 'string' ? error.cause.name : undefined,
      message: typeof error.cause.message === 'string' ? error.cause.message : undefined,
    }
    : undefined;
  return {
    name: typeof error.name === 'string' ? error.name : undefined,
    message: typeof error.message === 'string' ? error.message : String(error),
    stack: typeof error.stack === 'string' ? error.stack : undefined,
    cause,
  };
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === APP_ORIGIN ? origin : APP_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function json(request, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
      ...extraHeaders,
    },
  });
}

function sessionCookie(id) {
  return `allneeds_session=${encodeURIComponent(id)}; HttpOnly; Secure; SameSite=Lax; Path=/`;
}

function parseCookies(request) {
  const header = request.headers.get('Cookie');
  if (!header) return {};
  return Object.fromEntries(header.split(';').map((part) => {
    const [key, ...value] = part.trim().split('=');
    return [decodeURIComponent(key), decodeURIComponent(value.join('='))];
  }));
}

function adminDidSet(env) {
  return new Set(String(env.ADMIN_DIDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.startsWith('did:')));
}

function legacyAuthAllowed(env) {
  return String(env.ALLOW_LEGACY_AUTH || '') === '1';
}

function safeJsonArray(value) {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readSession(env, request) {
  const sessionId = parseCookies(request).allneeds_session;
  if (!sessionId) return null;
  const row = await env.DB.prepare(
    `SELECT
       s.id,
       s.did,
       s.expires_at,
       s.verified_at,
       u.handle
     FROM sessions s
     LEFT JOIN users u ON u.did = s.did
     WHERE s.id = ?
     LIMIT 1;`,
  ).bind(sessionId).first();
  if (!row) return null;
  if (row.expires_at && Date.parse(`${row.expires_at}Z`) <= Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return null;
  }
  return {
    id: row.id,
    did: row.did,
    handle: row.handle || null,
    verified: Boolean(row.verified_at),
  };
}

async function requireAdmin(env, request) {
  const session = await readSession(env, request);
  if (!session) return { rejection: json(request, { status: 'error', message: 'not signed in' }, 401) };
  if (!session.verified) {
    return { rejection: json(request, { status: 'error', message: 'verified sign-in required' }, 403) };
  }
  if (!adminDidSet(env).has(session.did)) {
    return { rejection: json(request, { status: 'error', message: 'admin access required' }, 403) };
  }
  return { session };
}

async function handleMe(request, env) {
  const session = await readSession(env, request);
  if (!session) {
    return json(request, {
      status: 'ok', signedIn: false, verified: false, admin: false,
    });
  }
  return json(request, {
    status: 'ok',
    signedIn: true,
    did: session.did,
    handle: session.handle,
    verified: session.verified,
    admin: session.verified && adminDidSet(env).has(session.did),
  });
}

async function handleAdminStrategies(request, env) {
  const authorization = await requireAdmin(env, request);
  if (authorization.rejection) return authorization.rejection;
  const url = new URL(request.url);
  const moderation = url.searchParams.get('moderation') === 'visible' ? 'visible' : 'hidden';
  const result = await env.DB.prepare(
    `SELECT
       s.id,
       s.client_key,
       s.author_did,
       s.title,
       s.body,
       s.need_ids,
       s.created_at,
       s.updated_at,
       s.visibility,
       s.moderation_status,
       s.add_count,
       u.handle,
       u.display_name,
       u.avatar_url
     FROM strategies s
     LEFT JOIN users u ON u.did = s.author_did
     WHERE s.moderation_status = ?
     ORDER BY s.updated_at DESC, s.id DESC
     LIMIT 250;`,
  ).bind(moderation).all();

  const strategies = (result.results || []).map((row) => ({
    id: row.id,
    clientKey: row.client_key || null,
    authorDid: row.author_did,
    title: row.title,
    body: row.body ?? null,
    needIds: safeJsonArray(row.need_ids),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    visibility: row.visibility === 'public' || row.visibility === 'followers' ? row.visibility : 'private',
    moderationStatus: row.moderation_status === 'hidden' ? 'hidden' : 'visible',
    addCount: typeof row.add_count === 'number' ? row.add_count : Number(row.add_count) || 0,
    author: row.author_did ? {
      did: row.author_did,
      handle: row.handle || null,
      displayName: row.display_name || null,
      avatarUrl: row.avatar_url || null,
      avatar: row.avatar_url || null,
    } : null,
  }));
  return json(request, {
    status: 'ok',
    moderation,
    moderatorDid: authorization.session.did,
    strategies,
  });
}

function isPublicApiRead(request, pathname) {
  if (request.method !== 'GET') return false;
  return pathname === '/api/health'
    || pathname === '/api/resolve-handle'
    || pathname === '/api/strategies/feed'
    || pathname === '/api/feed/strategies';
}

async function enforceVerifiedApiCutover(request, env, pathname) {
  if (legacyAuthAllowed(env) || !pathname.startsWith('/api/') || isPublicApiRead(request, pathname)) {
    return null;
  }
  const session = await readSession(env, request);
  if (!session) {
    return json(request, { status: 'error', message: 'not signed in' }, 401);
  }
  if (!session.verified) {
    return json(request, { status: 'error', message: 'verified sign-in required' }, 403);
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }

      if (request.method === 'GET' && pathname === '/oauth-client-metadata.json') {
        return new Response(JSON.stringify(OAUTH_CLIENT_METADATA), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }

      if (request.method === 'GET' && pathname === '/auth/login') {
        const result = await beginVerifiedLogin(request, env);
        if (result.error) return json(request, { status: 'error', message: result.error }, result.status || 400);
        return Response.redirect(result.redirect, 302);
      }

      if (request.method === 'GET' && pathname === '/auth/callback') {
        const result = await finishVerifiedLogin(request, env);
        return new Response(null, {
          status: 302,
          headers: {
            Location: result.redirect,
            'Set-Cookie': sessionCookie(result.sessionId),
            'Cache-Control': 'no-store',
          },
        });
      }

      if (request.method === 'POST' && pathname === '/auth/session' && !legacyAuthAllowed(env)) {
        return json(request, {
          status: 'error',
          message: 'legacy authentication disabled; use /auth/login',
        }, 410);
      }

      if (request.method === 'GET' && pathname === '/api/me') {
        return handleMe(request, env);
      }

      if (request.method === 'GET' && pathname === '/api/admin/strategies') {
        return handleAdminStrategies(request, env);
      }

      const cutoverRejection = await enforceVerifiedApiCutover(request, env, pathname);
      if (cutoverRejection) return cutoverRejection;

      return strategyWorker.fetch(request, env, ctx);
    } catch (error) {
      const errorId = crypto.randomUUID();
      console.error('verified OAuth route failed', { errorId, error: errorDetails(error) });
      return json(request, { status: 'error', message: 'authentication_failed', errorId }, 500);
    }
  },
};

