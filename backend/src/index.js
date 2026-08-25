import strategyWorker from './worker.js';
import {
  OAUTH_CLIENT_METADATA,
  beginVerifiedLogin,
  finishVerifiedLogin,
} from './oauth.js';

const APP_ORIGIN = 'https://allneeds.app';

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

      const cutoverRejection = await enforceVerifiedApiCutover(request, env, pathname);
      if (cutoverRejection) return cutoverRejection;

      return strategyWorker.fetch(request, env, ctx);
    } catch (error) {
      const errorId = crypto.randomUUID();
      console.error('verified OAuth route failed', { errorId, error });
      return json(request, { status: 'error', message: 'authentication_failed', errorId }, 500);
    }
  },
};
