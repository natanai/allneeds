const HANDOFF_KEY_PREFIX = 'allneeds-home-screen:';
export const HOME_SCREEN_HANDOFF_TTL_SECONDS = 15 * 60;

const HANDOFF_ID_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;
const HANDOFF_PROOF_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HANDOFF_SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CONFIRMATION_CODE_PATTERN = /^\d{6}$/;
const MAX_CONFIRMATION_ATTEMPTS = 5;

function handoffKey(id) {
  return `${HANDOFF_KEY_PREFIX}${id}`;
}

function encodeBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function validHomeScreenHandoffId(value) {
  return typeof value === 'string' && HANDOFF_ID_PATTERN.test(value);
}

export function validHomeScreenHandoffProof(value) {
  return typeof value === 'string' && HANDOFF_PROOF_PATTERN.test(value);
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return encodeBase64Url(new Uint8Array(digest));
}

export async function homeScreenHandoffProof(secret) {
  if (typeof secret !== 'string' || !HANDOFF_SECRET_PATTERN.test(secret)) return '';
  return sha256Base64Url(secret);
}

function confirmationCode() {
  const maximum = 0x1_0000_0000;
  const accepted = maximum - (maximum % 1_000_000);
  const values = new Uint32Array(1);
  do { crypto.getRandomValues(values); } while (values[0] >= accepted);
  return String(values[0] % 1_000_000).padStart(6, '0');
}

function parseRecord(row) {
  if (!row || typeof row.value !== 'string') return null;
  try {
    const value = JSON.parse(row.value);
    if (!value || typeof value !== 'object' || value.kind !== 'home-screen-sign-in') return null;
    return value;
  } catch {
    return null;
  }
}

export async function registerHomeScreenHandoff(env, id, proof) {
  if (!validHomeScreenHandoffId(id) || !validHomeScreenHandoffProof(proof)) return false;
  const value = JSON.stringify({
    version: 1,
    kind: 'home-screen-sign-in',
    status: 'pending',
    proof,
  });
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO oauth_states (key, value, expires_at, created_at)
     VALUES (?, ?, datetime('now', ?), CURRENT_TIMESTAMP);`,
  ).bind(handoffKey(id), value, `+${HOME_SCREEN_HANDOFF_TTL_SECONDS} seconds`).run();
  return Number(result?.meta?.changes ?? 0) === 1;
}

export async function completeHomeScreenHandoff(env, id, session) {
  if (!validHomeScreenHandoffId(id)) return { completed: false };
  const key = handoffKey(id);
  const row = await env.DB.prepare(
    'SELECT value, expires_at FROM oauth_states WHERE key = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1;',
  ).bind(key).first();
  const record = parseRecord(row);
  if (!record || record.status !== 'pending' || !validHomeScreenHandoffProof(record.proof)) return { completed: false };
  const code = confirmationCode();
  const value = JSON.stringify({
    version: 1,
    kind: 'home-screen-sign-in',
    status: 'complete',
    proof: record.proof,
    sessionId: session.sessionId,
    did: session.did,
    handle: session.handle ?? null,
    codeProof: await sha256Base64Url(code),
    attempts: 0,
  });
  const result = await env.DB.prepare(
    'UPDATE oauth_states SET value = ? WHERE key = ? AND value = ? AND expires_at > CURRENT_TIMESTAMP;',
  ).bind(value, key, row.value).run();
  return Number(result?.meta?.changes ?? 0) === 1
    ? { completed: true, confirmationCode: code }
    : { completed: false };
}

export async function claimHomeScreenHandoff(env, id, secret, code) {
  if (!validHomeScreenHandoffId(id) || typeof secret !== 'string') return { status: 'invalid' };
  const row = await env.DB.prepare(
    'SELECT value, expires_at FROM oauth_states WHERE key = ? LIMIT 1;',
  ).bind(handoffKey(id)).first();
  if (!row) return { status: 'missing' };
  if (typeof row.expires_at !== 'string' || Date.parse(`${row.expires_at}Z`) <= Date.now()) {
    return { status: 'expired' };
  }
  const record = parseRecord(row);
  const suppliedProof = await homeScreenHandoffProof(secret);
  if (!record || !suppliedProof || suppliedProof !== record.proof) return { status: 'invalid' };
  if (record.status === 'pending') return { status: 'pending' };
  if (record.status === 'locked') return { status: 'locked' };
  if (record.status !== 'complete'
    || typeof record.sessionId !== 'string'
    || typeof record.did !== 'string'
    || !record.did.startsWith('did:')
    || typeof record.codeProof !== 'string') return { status: 'invalid' };
  if (typeof code !== 'string' || !CONFIRMATION_CODE_PATTERN.test(code)
    || await sha256Base64Url(code) !== record.codeProof) {
    const attempts = Number.isInteger(record.attempts) ? record.attempts + 1 : 1;
    const locked = attempts >= MAX_CONFIRMATION_ATTEMPTS;
    const value = JSON.stringify({ ...record, status: locked ? 'locked' : 'complete', attempts });
    const result = await env.DB.prepare(
      'UPDATE oauth_states SET value = ? WHERE key = ? AND value = ? AND expires_at > CURRENT_TIMESTAMP;',
    ).bind(value, handoffKey(id), row.value).run();
    if (Number(result?.meta?.changes ?? 0) !== 1) return { status: 'retry' };
    return { status: locked ? 'locked' : 'code-mismatch', attemptsRemaining: Math.max(0, MAX_CONFIRMATION_ATTEMPTS - attempts) };
  }
  return {
    status: 'complete',
    sessionId: record.sessionId,
    did: record.did,
    handle: typeof record.handle === 'string' ? record.handle : null,
  };
}
