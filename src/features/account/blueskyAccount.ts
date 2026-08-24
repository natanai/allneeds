import { useEffect, useState } from 'react';

import { synchronizeCustomizerMirrors } from '../customizer/customizerSettings';
import { readInventory } from '../inventory/inventoryRepository';
import { readJournal } from '../journal/journalRepository';

const OAUTH_CLIENT_MODULE_URL = 'https://esm.sh/@atproto/oauth-client-browser@0.3.36';
const CLIENT_METADATA_URL = 'https://allneeds.app/oauth-client-metadata.json';
const BACKEND_BASE_URL = 'https://backend.allneeds.app';
const BACKEND_API_URL = `${BACKEND_BASE_URL}/api`;
const BACKEND_SNAPSHOT_KEY = 'allneeds_export_v1';
const LOGIN_INTENT_STORAGE_KEY = 'allneeds:bsky-login-intent';
const SESSION_HINT_STORAGE_KEY = 'allneeds:bsky-session-hint';
export const BLUESKY_SESSION_CHANGED_EVENT = 'allneeds:bsky-login-changed';

export type BlueskySession = { did: string; handle: string | null };

type RawOAuthSession = Record<string, unknown> & {
  sub?: string;
  did?: string;
  handle?: string;
  preferred_username?: string;
  signOut?: () => Promise<void>;
  getAccessToken?: () => Promise<unknown>;
};

type OAuthClient = {
  init: () => Promise<{ session?: RawOAuthSession } | null>;
  authorize: (handle: string, options: { scope: string }) => Promise<URL | string>;
};

type BrowserOAuthClientModule = {
  BrowserOAuthClient: {
    load: (options: { clientId: string; handleResolver: string; plcDirectoryUrl: string }) => Promise<OAuthClient>;
  };
};

let oauthClient: OAuthClient | null = null;
let rawSession: RawOAuthSession | null = null;
let currentSession: BlueskySession | null = null;
let initializePromise: Promise<BlueskySession | null> | null = null;
let backendSessionDid = '';
let backendSessionAccessToken = '';

function safeStorage(name: 'localStorage' | 'sessionStorage') {
  if (typeof window === 'undefined') return null;
  try { return window[name]; } catch { return null; }
}

function writeSessionHint(active: boolean) {
  try { safeStorage('localStorage')?.setItem(SESSION_HINT_STORAGE_KEY, active ? 'active' : 'none'); } catch { /* This hint is optional. */ }
}

function consumeLoginIntent() {
  const storage = safeStorage('sessionStorage');
  try {
    const intended = storage?.getItem(LOGIN_INTENT_STORAGE_KEY) === '1';
    if (intended) storage?.removeItem(LOGIN_INTENT_STORAGE_KEY);
    return intended;
  } catch { return false; }
}

function hasLoginIntent() {
  try { return safeStorage('sessionStorage')?.getItem(LOGIN_INTENT_STORAGE_KEY) === '1'; } catch { return false; }
}

function publishSession(session: BlueskySession | null, reason: string) {
  currentSession = session;
  writeSessionHint(Boolean(session));
  if (typeof window === 'undefined') return;
  window.allneedsSession = session;
  window.dispatchEvent(new CustomEvent(BLUESKY_SESSION_CHANGED_EVENT, {
    detail: { ...(session ?? {}), reason },
  }));
}

function normalizeSession(session: RawOAuthSession | null | undefined): BlueskySession | null {
  const did = typeof session?.sub === 'string' ? session.sub : typeof session?.did === 'string' ? session.did : '';
  if (!did) return null;
  const rawHandle = typeof session?.handle === 'string'
    ? session.handle
    : typeof session?.preferred_username === 'string' ? session.preferred_username : '';
  return { did, handle: rawHandle || null };
}

async function loadOAuthClient() {
  if (oauthClient) return oauthClient;
  const module = await import(/* @vite-ignore */ OAUTH_CLIENT_MODULE_URL) as BrowserOAuthClientModule;
  oauthClient = await module.BrowserOAuthClient.load({
    clientId: CLIENT_METADATA_URL,
    handleResolver: 'https://bsky.social',
    plcDirectoryUrl: 'https://plc.directory',
  });
  return oauthClient;
}

async function resolveAccessToken(session: RawOAuthSession) {
  if (typeof session.getAccessToken === 'function') {
    try {
      const token = await session.getAccessToken();
      if (typeof token === 'string') return token;
      if (token && typeof token === 'object') {
        const record = token as Record<string, unknown>;
        if (typeof record.accessToken === 'string') return record.accessToken;
        if (typeof record.access_token === 'string') return record.access_token;
      }
    } catch { /* Continue through compatible SDK token shapes. */ }
  }
  for (const candidate of [session.token, session.tokens, session.credentials, session.auth, session]) {
    if (!candidate || typeof candidate !== 'object') continue;
    const record = candidate as Record<string, unknown>;
    if (typeof record.accessToken === 'string') return record.accessToken;
    if (typeof record.access_token === 'string') return record.access_token;
    if (record.accessToken && typeof record.accessToken === 'object' && typeof (record.accessToken as { value?: unknown }).value === 'string') return (record.accessToken as { value: string }).value;
    if (record.access_token && typeof record.access_token === 'object' && typeof (record.access_token as { value?: unknown }).value === 'string') return (record.access_token as { value: string }).value;
  }
  return '';
}

async function ensureBackendSession(session: BlueskySession, raw: RawOAuthSession) {
  const accessToken = await resolveAccessToken(raw);
  if (backendSessionDid === session.did && backendSessionAccessToken === accessToken) return;
  const response = await fetch(`${BACKEND_BASE_URL}/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ did: session.did, accessToken: accessToken || null, handle: session.handle }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') {
    throw new Error('Could not start the allneeds profile session.');
  }
  backendSessionDid = session.did;
  backendSessionAccessToken = accessToken;
}

export function getBlueskySession() {
  if (currentSession) return currentSession;
  if (typeof window !== 'undefined' && window.allneedsSession?.did) return window.allneedsSession;
  return null;
}

export function useBlueskySession() {
  const [session, setSession] = useState<BlueskySession | null>(getBlueskySession);
  useEffect(() => {
    const update = () => setSession(getBlueskySession());
    window.addEventListener(BLUESKY_SESSION_CHANGED_EVENT, update);
    return () => window.removeEventListener(BLUESKY_SESSION_CHANGED_EVENT, update);
  }, []);
  return session;
}

export async function initializeBlueskyOAuth() {
  if (initializePromise) return initializePromise;
  initializePromise = (async () => {
    const client = await loadOAuthClient();
    const loginIntent = consumeLoginIntent();
    const result = await client.init();
    rawSession = result?.session ?? null;
    const session = normalizeSession(rawSession);
    if (session && rawSession) await ensureBackendSession(session, rawSession);
    publishSession(session, session ? (loginIntent ? 'signin' : 'restore') : 'signout');
    return session;
  })().catch((error) => {
    initializePromise = null;
    throw error;
  });
  return initializePromise;
}

export function normalizeBlueskyHandle(input: string) {
  const handle = input.trim().replace(/^@/, '');
  if (!handle) throw new Error('Please enter your Bluesky handle (for example: nathanael.ink).');
  if (handle.includes(':')) throw new Error("Bluesky handles cannot include ':' or suffixes like :1.");
  if (!/^[A-Za-z0-9.-]+$/.test(handle)) throw new Error('Bluesky handles can only contain letters, numbers, dashes, and periods (no @).');
  if (!handle.includes('.')) throw new Error('Bluesky handles must include a domain (for example: yourname.bsky.social).');
  if (handle.toLocaleLowerCase().includes('bksy.social')) throw new Error('Did you mean bsky.social? That handle does not resolve on Bluesky.');
  return handle;
}

export async function signInWithBluesky(input: string) {
  const handle = normalizeBlueskyHandle(input);
  await initializeBlueskyOAuth();
  const client = await loadOAuthClient();
  safeStorage('sessionStorage')?.setItem(LOGIN_INTENT_STORAGE_KEY, '1');
  const authorizationUrl = await client.authorize(handle, { scope: 'atproto' });
  window.location.href = authorizationUrl.toString();
}

export async function signOutFromBluesky() {
  try {
    if (rawSession?.signOut) await rawSession.signOut();
  } finally {
    await fetch(`${BACKEND_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined);
    rawSession = null;
    currentSession = null;
    initializePromise = null;
    oauthClient = null;
    backendSessionDid = '';
    backendSessionAccessToken = '';
    publishSession(null, 'signout');
  }
}

function captureLocalStorage() {
  const snapshot: Record<string, string> = {};
  const storage = safeStorage('localStorage');
  if (!storage) return snapshot;
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key) snapshot[key] = storage.getItem(key) ?? '';
  }
  return snapshot;
}

async function buildCurrentBrowserBackup() {
  const localStorage = captureLocalStorage();
  const parse = (key: string) => {
    try { return JSON.parse(localStorage[key] ?? 'null') as unknown; } catch { return null; }
  };
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    inventory: readInventory(),
    journalEntries: readJournal(),
    customizer: {
      theme: parse('nvcApp.theme'),
      navSettings: parse('nvcApp.navSettings'),
    },
    localStorage,
  };
}

async function requireBackendSession() {
  const session = getBlueskySession() ?? await initializeBlueskyOAuth();
  if (!session) throw new Error('Sign in with Bluesky first.');
  if (rawSession) await ensureBackendSession(session, rawSession);
  return session;
}

export async function saveCurrentBrowserToProfile() {
  await requireBackendSession();
  const snapshot = await buildCurrentBrowserBackup();
  const response = await fetch(`${BACKEND_API_URL}/user-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ key: BACKEND_SNAPSHOT_KEY, value: JSON.stringify(snapshot) }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') {
    throw new Error('Unable to save this browser to your profile.');
  }

  const strategies = snapshot.inventory
    .filter((entry) => entry.visibility === 'public' || entry.visibility === 'followers')
    .map((entry) => ({ title: entry.title, body: entry.description, needIds: entry.needSlugs, visibility: entry.visibility }));
  const syncResponse = await fetch(`${BACKEND_API_URL}/strategies/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ strategies }),
  }).catch(() => null);
  return { strategiesSynced: Boolean(syncResponse?.ok) };
}

export function extractProfileSnapshot(data: unknown) {
  if (!data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') return null;
  const settings = (data as { settings?: unknown }).settings;
  if (!Array.isArray(settings)) return null;
  const setting = settings.find((entry) => entry && typeof entry === 'object' && (entry as { key?: unknown }).key === BACKEND_SNAPSHOT_KEY);
  if (!setting || typeof (setting as { value?: unknown }).value !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse((setting as { value: string }).value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}

export async function loadProfileIntoCurrentBrowser() {
  await requireBackendSession();
  const response = await fetch(`${BACKEND_API_URL}/user-settings`, { credentials: 'include' });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error('Unable to load your saved profile.');
  const backup = extractProfileSnapshot(data);
  if (!backup) return 'empty' as const;
  const snapshot = backup.localStorage;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('The saved profile does not contain browser data.');
  if (!window.confirm('Replace this browser’s allneeds data with your saved profile?')) return 'canceled' as const;

  const previous = captureLocalStorage();
  try {
    window.localStorage.clear();
    Object.entries(snapshot as Record<string, unknown>).forEach(([key, value]) => {
      window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
    synchronizeCustomizerMirrors(snapshot as Record<string, unknown>);
  } catch (error) {
    window.localStorage.clear();
    Object.entries(previous).forEach(([key, value]) => window.localStorage.setItem(key, value));
    throw error;
  }
  window.location.reload();
  return 'loaded' as const;
}

export async function notifySharedStrategyAdded(strategyId: string) {
  const response = await fetch(`${BACKEND_API_URL}/strategies/${encodeURIComponent(strategyId)}/add-to-inventory`, {
    method: 'POST', credentials: 'include', cache: 'no-store',
  });
  if (!response.ok) throw new Error('Unable to update the shared add count.');
}

function isOAuthReturn() {
  if (typeof window === 'undefined') return false;
  const params = new URL(window.location.href).searchParams;
  return params.has('state') && (params.has('code') || params.has('error') || params.has('iss'));
}

export function initializeBlueskyForCurrentPage() {
  if (typeof window === 'undefined') return;
  const hint = safeStorage('localStorage')?.getItem(SESSION_HINT_STORAGE_KEY) ?? '';
  const mustInitialize = isOAuthReturn() || hasLoginIntent() || hint === 'active';
  if (mustInitialize) {
    const signedInReturn = hasLoginIntent();
    void initializeBlueskyOAuth().then(async (session) => {
      if (session && signedInReturn) await loadProfileIntoCurrentBrowser();
    }).catch(() => undefined);
    return;
  }
  if (hint === 'none' || window.location.hostname !== 'allneeds.app') return;
  const discover = () => { void initializeBlueskyOAuth().catch(() => undefined); };
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(discover, { timeout: 1_800 });
  else globalThis.setTimeout(discover, 900);
}

declare global {
  interface Window {
    allneedsSession?: BlueskySession | null;
  }
}
