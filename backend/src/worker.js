const APP_ORIGIN = 'https://allneeds.app';

function corsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '';
  const allowedOrigin = origin === APP_ORIGIN ? origin : APP_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function jsonResponse(request, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
      ...extraHeaders,
    },
  });
}

function ndjsonResponse(request, stream, status = 200) {
  return new Response(stream, {
    status,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
    },
  });
}

function errorResponse(request, message, status = 400, extra = {}) {
  return jsonResponse(request, { status: 'error', message, ...extra }, status);
}

function serverErrorResponse(request, error) {
  const errorId = crypto.randomUUID();
  console.error('allneeds backend error', { errorId, error });
  return errorResponse(request, 'internal_error', 500, { errorId });
}

function parseCookies(request) {
  const header = request.headers.get('Cookie');
  if (!header) return {};
  return Object.fromEntries(header.split(';').map((part) => {
    const [key, ...value] = part.trim().split('=');
    return [decodeURIComponent(key), decodeURIComponent(value.join('='))];
  }));
}

function sessionCookie(id) {
  return `allneeds_session=${encodeURIComponent(id)}; HttpOnly; Secure; SameSite=Lax; Path=/`;
}

function expiredSessionCookie() {
  return 'allneeds_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

function normalizeVisibility(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'public' || normalized === 'followers' ? normalized : 'private';
}

function normalizeModerationStatus(value) {
  return value === 'hidden' ? 'hidden' : 'visible';
}

function normalizeNeedId(value) {
  return value == null ? '' : String(value).trim().toLowerCase();
}

function normalizeNeedIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeNeedId).filter(Boolean))].sort();
}

function safeJsonParseArray(value) {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeClientKey(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 200);
}

function normalizeContributorField(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 120);
}

const D1_BATCH_SIZE = 75;

async function runStatementBatches(env, statements) {
  for (let index = 0; index < statements.length; index += D1_BATCH_SIZE) {
    await env.DB.batch(statements.slice(index, index + D1_BATCH_SIZE));
  }
}

function adminDidSet(env) {
  return new Set(String(env.ADMIN_DIDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.startsWith('did:')));
}

async function getSession(env, request) {
  const sessionId = parseCookies(request).allneeds_session;
  if (!sessionId) return null;
  const row = await env.DB.prepare(
    `SELECT id, did, expires_at, access_token, access_token_expires_at, verified_at
       FROM sessions
      WHERE id = ?
      LIMIT 1;`,
  ).bind(sessionId).first();
  if (!row) return null;
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return null;
  }
  return {
    id: row.id,
    did: row.did,
    accessToken: row.access_token || null,
    accessTokenExpiresAt: row.access_token_expires_at || null,
    verifiedAt: row.verified_at || null,
  };
}

async function requireSession(env, request) {
  const session = await getSession(env, request);
  if (!session) throw Object.assign(new Error('not signed in'), { status: 401 });
  return session;
}

async function requireVerifiedSession(env, request) {
  const session = await requireSession(env, request);
  if (!session.verifiedAt) {
    throw Object.assign(new Error('verified sign-in required'), { status: 403 });
  }
  return session;
}

async function requireAdminSession(env, request) {
  const session = await requireVerifiedSession(env, request);
  if (!adminDidSet(env).has(session.did)) {
    throw Object.assign(new Error('admin access required'), { status: 403 });
  }
  return session;
}

function mapStrategyRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientKey: row.client_key || null,
    authorDid: row.author_did,
    title: row.title,
    body: row.body ?? null,
    needIds: row.need_ids ? safeJsonParseArray(row.need_ids) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    visibility: normalizeVisibility(row.visibility),
    moderationStatus: normalizeModerationStatus(row.moderation_status),
    addCount: typeof row.add_count === 'number' ? row.add_count : Number(row.add_count) || 0,
    contributor: row.contributor_name || row.contributor_location ? {
      name: row.contributor_name || null,
      location: row.contributor_location || null,
    } : null,
    author: row.author_did ? {
      did: row.author_did,
      handle: row.handle || null,
      displayName: row.display_name || null,
      avatarUrl: row.avatar_url || null,
      avatar: row.avatar_url || null,
    } : null,
  };
}

const STRATEGY_SELECT = `
  SELECT
    s.id,
    s.client_key,
    s.author_did,
    s.title,
    s.body,
    s.need_ids,
    s.contributor_name,
    s.contributor_location,
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
`;

async function readStrategy(env, id) {
  return env.DB.prepare(`${STRATEGY_SELECT} WHERE s.id = ? LIMIT 1;`).bind(id).first();
}

async function replaceStrategyNeeds(env, strategyId, needIds) {
  const normalized = normalizeNeedIds(needIds);
  await env.DB.prepare('DELETE FROM strategy_needs WHERE strategy_id = ?').bind(strategyId).run();
  for (const needId of normalized) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO strategy_needs (strategy_id, need_id) VALUES (?, ?);',
    ).bind(strategyId, needId).run();
  }
  return normalized;
}

async function createStrategy(env, session, payload, { verifiedOnly = false } = {}) {
  if (verifiedOnly && !session.verifiedAt) {
    throw Object.assign(new Error('verified sign-in required'), { status: 403 });
  }
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  if (!title) throw Object.assign(new Error('title is required'), { status: 400 });
  const body = payload?.body == null ? null : String(payload.body);
  const needIds = normalizeNeedIds(payload?.needIds);
  const visibility = normalizeVisibility(payload?.visibility);
  const clientKey = normalizeClientKey(payload?.clientKey) || null;
  const contributorName = normalizeContributorField(payload?.firstName) || null;
  const contributorLocation = normalizeContributorField(payload?.location) || null;
  const result = await env.DB.prepare(
    `INSERT INTO strategies
       (author_did, client_key, title, body, need_ids, contributor_name, contributor_location, visibility, moderation_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'visible', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
  ).bind(
    session.did,
    clientKey,
    title,
    body,
    needIds.length ? JSON.stringify(needIds) : null,
    contributorName,
    contributorLocation,
    visibility,
  ).run();
  const id = result.meta?.last_row_id;
  if (!id) throw new Error('strategy insert did not return an id');
  await replaceStrategyNeeds(env, id, needIds);
  return readStrategy(env, id);
}

async function updateOwnedStrategy(env, session, id, payload) {
  const current = await readStrategy(env, id);
  if (!current) throw Object.assign(new Error('strategy not found'), { status: 404 });
  if (current.author_did !== session.did) {
    throw Object.assign(new Error('strategy is owned by another profile'), { status: 403 });
  }
  const title = payload?.title === undefined ? current.title : String(payload.title).trim();
  if (!title) throw Object.assign(new Error('title is required'), { status: 400 });
  const body = payload?.body === undefined ? current.body : payload.body == null ? null : String(payload.body);
  const visibility = payload?.visibility === undefined
    ? normalizeVisibility(current.visibility)
    : normalizeVisibility(payload.visibility);
  const needIds = payload?.needIds === undefined
    ? safeJsonParseArray(current.need_ids)
    : normalizeNeedIds(payload.needIds);
  const clientKeyInput = payload?.clientKey === undefined ? current.client_key : normalizeClientKey(payload.clientKey);
  const clientKey = clientKeyInput || null;
  const contributorName = payload?.firstName === undefined
    ? current.contributor_name
    : normalizeContributorField(payload.firstName) || null;
  const contributorLocation = payload?.location === undefined
    ? current.contributor_location
    : normalizeContributorField(payload.location) || null;
  await env.DB.prepare(
    `UPDATE strategies
        SET client_key = ?, title = ?, body = ?, need_ids = ?, contributor_name = ?, contributor_location = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND author_did = ?;`,
  ).bind(
    clientKey,
    title,
    body,
    needIds.length ? JSON.stringify(normalizeNeedIds(needIds)) : null,
    contributorName,
    contributorLocation,
    visibility,
    id,
    session.did,
  ).run();
  await replaceStrategyNeeds(env, id, needIds);
  return readStrategy(env, id);
}

async function fetchPublicProfile(did) {
  const url = new URL('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile');
  url.searchParams.set('actor', did);
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const profile = await response.json().catch(() => null);
  if (!profile || profile.did !== did) return null;
  return profile;
}

async function upsertUserProfile(env, did, fallbackHandle = '') {
  const profile = await fetchPublicProfile(did).catch(() => null);
  const handle = profile?.handle || fallbackHandle || did;
  const displayName = profile?.displayName || null;
  const avatar = profile?.avatar || null;
  await env.DB.prepare(
    `INSERT INTO users (did, handle, display_name, avatar_url, created_at, last_login_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(did) DO UPDATE SET
       handle = excluded.handle,
       display_name = COALESCE(excluded.display_name, users.display_name),
       avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
       last_login_at = CURRENT_TIMESTAMP;`,
  ).bind(did, handle, displayName, avatar).run();
}

async function handleLegacyAuthSession(request, env) {
  const body = await request.json().catch(() => null);
  const did = typeof body?.did === 'string' ? body.did.trim() : '';
  if (!did.startsWith('did:')) return errorResponse(request, 'invalid did', 400);
  const handle = typeof body?.handle === 'string' ? body.handle.trim() : '';
  const accessToken = typeof body?.accessToken === 'string' && body.accessToken.trim()
    ? body.accessToken.trim()
    : null;
  await upsertUserProfile(env, did, handle);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO sessions (id, did, access_token, created_at, verified_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, NULL);`,
  ).bind(id, did, accessToken).run();
  return jsonResponse(request, { status: 'ok', verified: false }, 200, {
    'Set-Cookie': sessionCookie(id),
  });
}

async function handleLogout(request, env) {
  const session = await getSession(env, request);
  if (session) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(session.id).run();
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders(request), 'Set-Cookie': expiredSessionCookie() },
  });
}

async function handleMe(request, env) {
  const session = await getSession(env, request);
  if (!session) return jsonResponse(request, { status: 'ok', signedIn: false, verified: false, admin: false });
  return jsonResponse(request, {
    status: 'ok',
    signedIn: true,
    did: session.did,
    verified: Boolean(session.verifiedAt),
    admin: Boolean(session.verifiedAt && adminDidSet(env).has(session.did)),
  });
}

async function handleHealth(request, env) {
  const row = await env.DB.prepare('SELECT 1 AS ok').first();
  return jsonResponse(request, { status: 'ok', db: row });
}

async function handleGetStrategies(request, env) {
  const session = await requireSession(env, request);
  const result = await env.DB.prepare(
    `${STRATEGY_SELECT} WHERE s.author_did = ? ORDER BY s.updated_at DESC, s.id DESC LIMIT 250;`,
  ).bind(session.did).all();
  return jsonResponse(request, {
    status: 'ok',
    did: session.did,
    strategies: (result.results || []).map(mapStrategyRow),
  });
}

async function handlePostStrategy(request, env) {
  const session = await requireSession(env, request);
  const body = await request.json().catch(() => null);
  const row = await createStrategy(env, session, body || {});
  return jsonResponse(request, { status: 'ok', strategy: mapStrategyRow(row) }, 201);
}

async function handlePatchStrategy(request, env, id) {
  const session = await requireVerifiedSession(env, request);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return errorResponse(request, 'invalid body', 400);
  const row = await updateOwnedStrategy(env, session, id, body);
  return jsonResponse(request, { status: 'ok', strategy: mapStrategyRow(row) });
}

async function handleDeleteStrategy(request, env, id) {
  const session = await requireVerifiedSession(env, request);
  const row = await readStrategy(env, id);
  if (!row) return errorResponse(request, 'strategy not found', 404);
  if (row.author_did !== session.did) return errorResponse(request, 'strategy is owned by another profile', 403);
  await env.DB.prepare('DELETE FROM strategy_needs WHERE strategy_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM strategies WHERE id = ? AND author_did = ?').bind(id, session.did).run();
  return jsonResponse(request, { status: 'ok', deleted: id });
}

async function handleStrategyFeed(request, env) {
  const session = await getSession(env, request);
  const url = new URL(request.url);
  const scope = url.searchParams.get('scope') === 'follows' ? 'follows' : 'public';
  const sort = url.searchParams.get('sort') === 'popular' ? 'popular' : 'recent';
  const need = normalizeNeedId(url.searchParams.get('need'));
  const limitRaw = Number.parseInt(url.searchParams.get('limit') || '50', 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

  const where = ["s.moderation_status = 'visible'"];
  const params = [];
  if (scope === 'public' || !session) {
    where.push("s.visibility = 'public'");
  } else {
    // Followers-only discovery remains a compatibility feature. Public API lookup avoids
    // treating the browser's DPoP access token as a bearer credential in this Worker.
    const followsUrl = new URL('https://public.api.bsky.app/xrpc/app.bsky.graph.getFollows');
    followsUrl.searchParams.set('actor', session.did);
    followsUrl.searchParams.set('limit', '100');
    const followsResponse = await fetch(followsUrl).catch(() => null);
    const followsData = followsResponse?.ok ? await followsResponse.json().catch(() => null) : null;
    const followDids = Array.isArray(followsData?.follows)
      ? followsData.follows.map((entry) => entry?.did).filter((did) => typeof did === 'string' && did.startsWith('did:'))
      : [];
    const clauses = ["s.visibility = 'public'", 's.author_did = ?'];
    params.push(session.did);
    if (followDids.length) {
      clauses.push(`(s.visibility = 'followers' AND s.author_did IN (${followDids.map(() => '?').join(', ')}))`);
      params.push(...followDids);
    }
    where.push(`(${clauses.join(' OR ')})`);
  }

  let join = '';
  if (need) {
    join = 'JOIN strategy_needs sn ON sn.strategy_id = s.id';
    where.push('sn.need_id = ?');
    params.push(need);
  }
  const order = sort === 'popular'
    ? 'ORDER BY s.add_count DESC, s.updated_at DESC, s.id DESC'
    : 'ORDER BY s.updated_at DESC, s.id DESC';
  const result = await env.DB.prepare(
    `${STRATEGY_SELECT.replace('FROM strategies s', `FROM strategies s ${join}`)}
      WHERE ${where.join(' AND ')}
      ${order}
      LIMIT ?;`,
  ).bind(...params, limit).all();
  return jsonResponse(request, {
    status: 'ok',
    scope,
    sort,
    need: need || null,
    viewerDid: session?.did || null,
    strategies: (result.results || []).map(mapStrategyRow),
  });
}

function strategySignature(payload) {
  return JSON.stringify([
    typeof payload?.title === 'string' ? payload.title.trim() : '',
    payload?.body == null ? '' : String(payload.body),
    normalizeNeedIds(payload?.needIds),
    normalizeVisibility(payload?.visibility),
  ]);
}

async function handleLegacySyncStrategies(request, env) {
  const session = await requireSession(env, request);
  const body = await request.json().catch(() => null);
  const incoming = Array.isArray(body?.strategies) ? body.strategies : null;
  if (!incoming) return errorResponse(request, 'strategies array is required', 400);

  const desired = new Map();
  for (const entry of incoming) {
    const visibility = normalizeVisibility(entry?.visibility);
    const title = typeof entry?.title === 'string' ? entry.title.trim() : '';
    if (!title || (visibility !== 'public' && visibility !== 'followers')) continue;
    const payload = {
      title,
      body: entry?.body == null ? '' : String(entry.body),
      needIds: normalizeNeedIds(entry?.needIds),
      visibility,
    };
    const key = strategySignature(payload);
    if (!desired.has(key)) desired.set(key, []);
    desired.get(key).push(payload);
  }

  const existing = await env.DB.prepare(
    `SELECT id, title, body, need_ids, visibility
       FROM strategies
      WHERE author_did = ? AND client_key IS NULL AND visibility IN ('public', 'followers');`,
  ).bind(session.did).all();
  const existingBySignature = new Map();
  for (const row of existing.results || []) {
    const key = strategySignature({
      title: row.title,
      body: row.body,
      needIds: safeJsonParseArray(row.need_ids),
      visibility: row.visibility,
    });
    if (!existingBySignature.has(key)) existingBySignature.set(key, []);
    existingBySignature.get(key).push(row.id);
  }

  const idsToDelete = [];
  for (const [key, ids] of existingBySignature.entries()) {
    const wanted = desired.get(key)?.length || 0;
    if (ids.length > wanted) idsToDelete.push(...ids.slice(wanted));
  }
  for (const id of idsToDelete) {
    await env.DB.prepare('DELETE FROM strategy_needs WHERE strategy_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM strategies WHERE id = ?').bind(id).run();
  }

  let inserted = 0;
  for (const [key, payloads] of desired.entries()) {
    const have = existingBySignature.get(key)?.length || 0;
    for (let index = have; index < payloads.length; index += 1) {
      await createStrategy(env, session, payloads[index]);
      inserted += 1;
    }
  }
  return jsonResponse(request, { status: 'ok', did: session.did, deleted: idsToDelete.length, inserted });
}

async function reconcileStableStrategies(env, session, incoming) {
  const desiredByClientKey = new Map();
  for (const entry of incoming) {
    const clientKey = normalizeClientKey(entry?.clientKey);
    const title = typeof entry?.title === 'string' ? entry.title.trim() : '';
    const visibility = normalizeVisibility(entry?.visibility);
    if (!clientKey || !title || (visibility !== 'public' && visibility !== 'followers')) continue;
    const needIds = normalizeNeedIds(entry?.needIds);
    desiredByClientKey.set(clientKey, {
      clientKey,
      title,
      body: entry?.body == null ? null : String(entry.body),
      needIds,
      needIdsJson: needIds.length ? JSON.stringify(needIds) : null,
      contributorName: normalizeContributorField(entry?.firstName) || null,
      contributorLocation: normalizeContributorField(entry?.location) || null,
      visibility,
    });
  }

  // The complete browser snapshot remains authoritative, but this single read lets the
  // Worker write only the actual delta. A 40-strategy no-op save therefore performs no
  // strategy or relationship writes at all.
  const existing = await env.DB.prepare(
    `${STRATEGY_SELECT} WHERE s.author_did = ? ORDER BY s.id LIMIT 500;`,
  ).bind(session.did).all();

  const existingByClientKey = new Map();
  const legacyBySignature = new Map();
  for (const row of existing.results || []) {
    if (row.client_key) {
      existingByClientKey.set(row.client_key, row);
      continue;
    }
    const signature = strategySignature({
      title: row.title,
      body: row.body,
      needIds: safeJsonParseArray(row.need_ids),
      visibility: row.visibility,
    });
    const matches = legacyBySignature.get(signature) || [];
    matches.push(row);
    legacyBySignature.set(signature, matches);
  }

  const strategyWrites = [];
  const relationshipChanges = [];
  let changedCount = 0;
  let unchangedCount = 0;
  for (const [clientKey, entry] of desiredByClientKey) {
    let current = existingByClientKey.get(clientKey) || null;
    if (!current) {
      // One-time adoption path for an exact legacy row owned by the same DID. This preserves
      // its numeric remote id instead of deleting/recreating it when stable keys are introduced.
      const matches = legacyBySignature.get(strategySignature(entry)) || [];
      current = matches.shift() || null;
    }

    if (current) {
      const currentNeedIds = normalizeNeedIds(safeJsonParseArray(current.need_ids));
      const needsChanged = JSON.stringify(currentNeedIds) !== JSON.stringify(entry.needIds);
      const strategyChanged = current.client_key !== clientKey
        || current.title !== entry.title
        || (current.body == null ? null : String(current.body)) !== entry.body
        || current.contributor_name !== entry.contributorName
        || current.contributor_location !== entry.contributorLocation
        || normalizeVisibility(current.visibility) !== entry.visibility
        || needsChanged;
      if (strategyChanged) {
        changedCount += 1;
        strategyWrites.push(env.DB.prepare(
          `UPDATE strategies
              SET client_key = ?, title = ?, body = ?, need_ids = ?, contributor_name = ?, contributor_location = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND author_did = ?;`,
        ).bind(
          clientKey,
          entry.title,
          entry.body,
          entry.needIdsJson,
          entry.contributorName,
          entry.contributorLocation,
          entry.visibility,
          current.id,
          session.did,
        ));
        if (needsChanged) relationshipChanges.push({ clientKey, needIds: entry.needIds, replace: true });
      } else {
        unchangedCount += 1;
      }
    } else {
      changedCount += 1;
      strategyWrites.push(env.DB.prepare(
        `INSERT INTO strategies
           (author_did, client_key, title, body, need_ids, contributor_name, contributor_location, visibility, moderation_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'visible', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      ).bind(
        session.did,
        clientKey,
        entry.title,
        entry.body,
        entry.needIdsJson,
        entry.contributorName,
        entry.contributorLocation,
        entry.visibility,
      ));
      if (entry.needIds.length) relationshipChanges.push({ clientKey, needIds: entry.needIds, replace: false });
    }
  }
  await runStatementBatches(env, strategyWrites);

  const relationshipWrites = [];
  for (const change of relationshipChanges) {
    if (change.replace) {
      relationshipWrites.push(env.DB.prepare(
        `DELETE FROM strategy_needs
          WHERE strategy_id = (SELECT id FROM strategies WHERE author_did = ? AND client_key = ?);`,
      ).bind(session.did, change.clientKey));
    }
    for (const needId of change.needIds) {
      relationshipWrites.push(env.DB.prepare(
        `INSERT OR IGNORE INTO strategy_needs (strategy_id, need_id)
         SELECT id, ? FROM strategies WHERE author_did = ? AND client_key = ?;`,
      ).bind(needId, session.did, change.clientKey));
    }
  }

  const rowsToUnpublish = [...existingByClientKey.values()].filter((row) => (
    !desiredByClientKey.has(row.client_key) && normalizeVisibility(row.visibility) !== 'private'
  ));
  for (const row of rowsToUnpublish) {
    relationshipWrites.push(env.DB.prepare(
      `UPDATE strategies
          SET visibility = 'private', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND author_did = ? AND visibility <> 'private';`,
    ).bind(row.id, session.did));
  }
  await runStatementBatches(env, relationshipWrites);

  return {
    did: session.did,
    syncedCount: desiredByClientKey.size,
    changedCount,
    unchangedCount,
    unpublished: rowsToUnpublish.length,
    syncedAt: new Date().toISOString(),
  };
}

async function handleStableSyncStrategies(request, env) {
  const session = await requireVerifiedSession(env, request);
  const body = await request.json().catch(() => null);
  const incoming = Array.isArray(body?.strategies) ? body.strategies : null;
  if (!incoming) return errorResponse(request, 'strategies array is required', 400);
  const result = await reconcileStableStrategies(env, session, incoming);
  return jsonResponse(request, { status: 'ok', ...result });
}

async function handleModeration(request, env, id, nextStatus) {
  const admin = await requireAdminSession(env, request);
  const current = await readStrategy(env, id);
  if (!current) return errorResponse(request, 'strategy not found', 404);
  await env.DB.prepare(
    'UPDATE strategies SET moderation_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
  ).bind(nextStatus, id).run();
  const updated = await readStrategy(env, id);
  return jsonResponse(request, {
    status: 'ok',
    moderatorDid: admin.did,
    strategy: mapStrategyRow(updated),
  });
}

async function handleIncrementAddCount(request, env, id) {
  await requireSession(env, request);
  const result = await env.DB.prepare(
    'UPDATE strategies SET add_count = add_count + 1 WHERE id = ?;',
  ).bind(id).run();
  if (!result.meta?.changes) return errorResponse(request, 'strategy not found', 404);
  return jsonResponse(request, { status: 'ok', strategy: mapStrategyRow(await readStrategy(env, id)) });
}

async function handleResolveHandle(request, env) {
  const url = new URL(request.url);
  const handle = String(url.searchParams.get('handle') || '').trim().replace(/^@/, '').toLowerCase();
  if (!handle) return errorResponse(request, 'handle is required', 400);
  const profileUrl = new URL('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile');
  profileUrl.searchParams.set('actor', handle);
  const response = await fetch(profileUrl);
  if (!response.ok) {
    if (response.status === 400 || response.status === 404) {
      return errorResponse(request, 'Bluesky profile not found', 404);
    }
    return errorResponse(request, 'Bluesky username check unavailable', 502);
  }
  const profile = await response.json();
  if (!profile?.did || !profile?.handle) return errorResponse(request, 'profile response missing identity', 502);
  await upsertUserProfile(env, profile.did, profile.handle);
  return jsonResponse(request, {
    status: 'ok', did: profile.did, handle: profile.handle,
    displayName: profile.displayName || null, avatar: profile.avatar || null,
  });
}

async function handleGetUserSettings(request, env) {
  const session = await requireSession(env, request);
  const result = await env.DB.prepare(
    'SELECT key, value, updated_at FROM user_settings WHERE did = ? ORDER BY key;',
  ).bind(session.did).all();
  return jsonResponse(request, { status: 'ok', did: session.did, settings: result.results || [] });
}

async function writeUserSetting(env, session, key, value) {
  const savedAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO user_settings (did, key, value, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(did, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
  ).bind(session.did, String(key), String(value), savedAt).run();
  return savedAt;
}

async function handlePostUserSettings(request, env) {
  const session = await requireSession(env, request);
  const body = await request.json().catch(() => null);
  if (!body?.key || body.value === undefined) return errorResponse(request, 'key and value are required', 400);
  const savedAt = await writeUserSetting(env, session, body.key, body.value);
  return jsonResponse(request, {
    status: 'ok', did: session.did, key: String(body.key), value: String(body.value), savedAt,
  });
}

async function handleSaveProfile(request, env) {
  const session = await requireVerifiedSession(env, request);
  const body = await request.json().catch(() => null);
  if (!body?.key || body.value === undefined) return errorResponse(request, 'key and value are required', 400);
  if (!Array.isArray(body.strategies)) return errorResponse(request, 'strategies array is required', 400);

  // Keep the snapshot durable before strategy work begins. The streamed first event lets
  // the browser report that exact fact while the same Worker request reconciles the delta.
  const savedAt = await writeUserSetting(env, session, body.key, body.value);
  const encoder = new TextEncoder();
  const encodeEvent = (event) => encoder.encode(`${JSON.stringify(event)}\n`);
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encodeEvent({
        stage: 'profile-saved',
        status: 'ok',
        savedAt,
        strategyCount: body.strategies.length,
      }));
      try {
        const result = await reconcileStableStrategies(env, session, body.strategies);
        controller.enqueue(encodeEvent({ stage: 'complete', status: 'ok', savedAt, ...result }));
      } catch (error) {
        const errorId = crypto.randomUUID();
        console.error('allneeds profile strategy sync error', { errorId, error });
        controller.enqueue(encodeEvent({
          stage: 'complete',
          status: 'partial',
          savedAt,
          syncedCount: body.strategies.length,
          errorId,
        }));
      } finally {
        controller.close();
      }
    },
  });
  return ndjsonResponse(request, stream);
}

async function handleGetJournals(request, env) {
  const session = await requireSession(env, request);
  const result = await env.DB.prepare(
    'SELECT id, did, created_at, updated_at, title, body FROM journals WHERE did = ? ORDER BY created_at DESC;',
  ).bind(session.did).all();
  return jsonResponse(request, { status: 'ok', did: session.did, journals: result.results || [] });
}

async function handlePostJournals(request, env) {
  const session = await requireSession(env, request);
  const body = await request.json().catch(() => ({}));
  await env.DB.prepare('INSERT INTO journals (did, title, body) VALUES (?, ?, ?);')
    .bind(session.did, body?.title ?? null, body?.body ?? null).run();
  return jsonResponse(request, { status: 'ok' }, 201);
}

function numericId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function route(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (method === 'GET' && pathname === '/api/health') return handleHealth(request, env);
  if (method === 'GET' && pathname === '/api/me') return handleMe(request, env);
  if (method === 'POST' && pathname === '/auth/session') return handleLegacyAuthSession(request, env);
  if (method === 'POST' && pathname === '/auth/logout') return handleLogout(request, env);
  if (method === 'GET' && pathname === '/api/resolve-handle') return handleResolveHandle(request, env);
  if (method === 'GET' && pathname === '/api/strategies/feed') return handleStrategyFeed(request, env);
  if (method === 'GET' && pathname === '/api/feed/strategies') return handleStrategyFeed(request, env);
  if (method === 'GET' && pathname === '/api/strategies') return handleGetStrategies(request, env);
  if (method === 'POST' && pathname === '/api/strategies') return handlePostStrategy(request, env);
  if (method === 'POST' && pathname === '/api/strategies/sync') return handleLegacySyncStrategies(request, env);
  if (method === 'POST' && pathname === '/api/strategies/sync-owned') return handleStableSyncStrategies(request, env);
  if (method === 'GET' && pathname === '/api/user-settings') return handleGetUserSettings(request, env);
  if (method === 'POST' && pathname === '/api/user-settings') return handlePostUserSettings(request, env);
  if (method === 'POST' && pathname === '/api/profile/save') return handleSaveProfile(request, env);
  if (method === 'GET' && pathname === '/api/journals') return handleGetJournals(request, env);
  if (method === 'POST' && pathname === '/api/journals') return handlePostJournals(request, env);

  const strategyMatch = pathname.match(/^\/api\/strategies\/(\d+)$/);
  if (strategyMatch) {
    const id = numericId(strategyMatch[1]);
    if (!id) return errorResponse(request, 'invalid strategy id', 400);
    if (method === 'PATCH') return handlePatchStrategy(request, env, id);
    if (method === 'DELETE') return handleDeleteStrategy(request, env, id);
  }

  const addMatch = pathname.match(/^\/api\/strategies\/(\d+)\/add-to-inventory$/);
  if (method === 'POST' && addMatch) {
    const id = numericId(addMatch[1]);
    if (!id) return errorResponse(request, 'invalid strategy id', 400);
    return handleIncrementAddCount(request, env, id);
  }

  const moderationMatch = pathname.match(/^\/api\/admin\/strategies\/(\d+)\/(hide|restore)$/);
  if (method === 'POST' && moderationMatch) {
    const id = numericId(moderationMatch[1]);
    if (!id) return errorResponse(request, 'invalid strategy id', 400);
    return handleModeration(request, env, id, moderationMatch[2] === 'hide' ? 'hidden' : 'visible');
  }

  return errorResponse(request, 'not found', 404);
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      const status = Number(error?.status) || 500;
      if (status !== 500) return errorResponse(request, error?.message || 'request failed', status);
      return serverErrorResponse(request, error);
    }
  },
};
