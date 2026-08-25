import strategyWorker from './worker.js';
import {
  OAUTH_CLIENT_METADATA,
  beginVerifiedLogin,
  finishVerifiedLogin,
} from './oauth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function sessionCookie(id) {
  return `allneeds_session=${encodeURIComponent(id)}; HttpOnly; Secure; SameSite=Lax; Path=/`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (request.method === 'GET' && url.pathname === '/oauth-client-metadata.json') {
        return new Response(JSON.stringify(OAUTH_CLIENT_METADATA), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }

      if (request.method === 'GET' && url.pathname === '/auth/login') {
        const result = await beginVerifiedLogin(request, env);
        if (result.error) return json({ status: 'error', message: result.error }, result.status || 400);
        return Response.redirect(result.redirect, 302);
      }

      if (request.method === 'GET' && url.pathname === '/auth/callback') {
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

      return strategyWorker.fetch(request, env, ctx);
    } catch (error) {
      const errorId = crypto.randomUUID();
      console.error('verified OAuth route failed', { errorId, error });
      return json({ status: 'error', message: 'authentication_failed', errorId }, 500);
    }
  },
};
