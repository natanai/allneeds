import { useEffect, useState, useSyncExternalStore } from 'react';

import { captureBrowserStorage } from '../../persistence/browserBackup';
import { synchronizeCustomizerMirrors } from '../customizer/customizerSettings';
import { readInventory } from '../inventory/inventoryRepository';
import { readJournal } from '../journal/journalRepository';
import { profilePublishableStrategies } from './profileStrategySync';
import {
  applyCombinedProfile,
  compareProfileSnapshots,
  profileBrowserSnapshot,
  profileHasDifferences,
  type ProfileComparison,
  type SettingsSource,
} from './profileReconciliation';

const BACKEND_BASE_URL = 'https://backend.allneeds.app';
const BACKEND_API_URL = `${BACKEND_BASE_URL}/api`;
const BACKEND_SNAPSHOT_KEY = 'allneeds_export_v1';
const LOGIN_INTENT_STORAGE_KEY = 'allneeds:bsky-login-intent';
const SESSION_HINT_STORAGE_KEY = 'allneeds:bsky-session-hint';
const SESSION_CACHE_STORAGE_KEY = 'allneeds:bsky-session-cache-v1';
const SESSION_CACHE_FRESH_MS = 60 * 60 * 1_000;
export const BLUESKY_SESSION_CHANGED_EVENT = 'allneeds:bsky-login-changed';

export type BlueskySession = {
  did: string;
  handle: string | null;
  verified: boolean;
  admin: boolean;
};

type BackendSessionResponse = {
  status?: string;
  signedIn?: boolean;
  did?: string;
  handle?: string | null;
  verified?: boolean;
  admin?: boolean;
};

type ResolveHandleResponse = {
  status?: string;
  handle?: string;
  message?: string;
};

type ProfileSaveEvent = {
  stage?: 'profile-saved' | 'complete';
  status?: string;
  savedAt?: string;
  syncedAt?: string;
  syncedCount?: number;
  changedCount?: number;
  unchangedCount?: number;
  unpublished?: number;
};

export type ProfileSaveProgress = {
  stage: 'syncing-strategies';
  profileSavedAt: string;
  strategyCount: number;
};

export type ProfileSaveResult = {
  profileSavedAt: string;
  strategiesSynced: boolean;
  strategiesSyncedAt: string | null;
  strategyCount: number;
  changedStrategyCount: number | null;
  unchangedStrategyCount: number | null;
  unpublishedStrategyCount: number | null;
};

function readCachedSession() {
  try {
    const parsed: unknown = JSON.parse(safeStorage('sessionStorage')?.getItem(SESSION_CACHE_STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const cached = parsed as { version?: unknown; checkedAt?: unknown; session?: unknown };
    if (cached.version !== 1 || typeof cached.checkedAt !== 'number' || !cached.session
      || typeof cached.session !== 'object' || Array.isArray(cached.session)) return null;
    const age = Date.now() - cached.checkedAt;
    if (age < 0 || age > SESSION_CACHE_FRESH_MS) return null;
    const session = cached.session as Partial<BlueskySession>;
    if (typeof session.did !== 'string' || !session.did.startsWith('did:')) return null;
    return {
      checkedAt: cached.checkedAt,
      session: {
        did: session.did,
        handle: typeof session.handle === 'string' ? session.handle : null,
        verified: session.verified === true,
        admin: session.admin === true && session.verified === true,
      } satisfies BlueskySession,
    };
  } catch { return null; }
}

const restoredSession = readCachedSession();
let currentSession: BlueskySession | null = restoredSession?.session ?? null;
let currentSessionCheckedAt = restoredSession?.checkedAt ?? 0;
let initializePromise: Promise<BlueskySession | null> | null = null;

type ProfileReview =
  | { phase: 'loading'; did: string }
  | { phase: 'ready'; did: string; comparison: ProfileComparison }
  | { phase: 'error'; did: string; message: string }
  | { phase: 'done'; did: string; message: string; combined?: boolean };
let profileReview: ProfileReview | null = null;
const profileReviewListeners = new Set<() => void>();

function publishProfileReview(review: ProfileReview | null) {
  profileReview = review;
  profileReviewListeners.forEach((listener) => listener());
}

export function useProfileReview() {
  return useSyncExternalStore((listener) => {
    profileReviewListeners.add(listener);
    return () => { profileReviewListeners.delete(listener); };
  }, () => profileReview, () => null);
}

export function dismissProfileReview() {
  publishProfileReview(null);
}

export async function combineReviewedProfile(settings: SettingsSource) {
  if (profileReview?.phase !== 'ready') throw new Error('Review your saved profile first.');
  const review = profileReview;
  if (getBlueskySession()?.did !== review.did) throw new Error('Your account changed. Review the saved profile again.');
  const combined = applyCombinedProfile(window.localStorage, review.comparison, settings, review.did);
  synchronizeCustomizerMirrors(combined);
  publishProfileReview({ phase: 'done', did: review.did, combined: true, message: 'Entries from both places are now on this device. A recovery copy of each original is available in Account & data.' });
}

if (typeof window !== 'undefined' && currentSession) {
  window.allneedsSession = currentSession;
  writeSessionHint(true);
}

function safeStorage(name: 'localStorage' | 'sessionStorage') {
  if (typeof window === 'undefined') return null;
  try { return window[name]; } catch { return null; }
}

function writeSessionHint(active: boolean) {
  try { safeStorage('localStorage')?.setItem(SESSION_HINT_STORAGE_KEY, active ? 'active' : 'none'); } catch { /* Optional hint. */ }
}

function hasLoginIntent() {
  try { return safeStorage('sessionStorage')?.getItem(LOGIN_INTENT_STORAGE_KEY) === '1'; } catch { return false; }
}

function consumeLoginIntent() {
  const storage = safeStorage('sessionStorage');
  try {
    const intended = storage?.getItem(LOGIN_INTENT_STORAGE_KEY) === '1';
    if (intended) storage?.removeItem(LOGIN_INTENT_STORAGE_KEY);
    return intended;
  } catch { return false; }
}

function publishSession(session: BlueskySession | null, reason: string) {
  if (profileReview && profileReview.did !== session?.did) dismissProfileReview();
  currentSession = session;
  currentSessionCheckedAt = session ? Date.now() : 0;
  writeSessionHint(Boolean(session));
  try {
    const storage = safeStorage('sessionStorage');
    if (session) {
      storage?.setItem(SESSION_CACHE_STORAGE_KEY, JSON.stringify({
        version: 1,
        checkedAt: currentSessionCheckedAt,
        session,
      }));
    } else {
      storage?.removeItem(SESSION_CACHE_STORAGE_KEY);
    }
  } catch { /* Session restoration remains optional. */ }
  if (typeof window === 'undefined') return;
  window.allneedsSession = session;
  window.dispatchEvent(new CustomEvent(BLUESKY_SESSION_CHANGED_EVENT, {
    detail: { ...(session ?? {}), reason },
  }));
}

function normalizeBackendSession(data: unknown): BlueskySession | null {
  if (!data || typeof data !== 'object') return null;
  const result = data as BackendSessionResponse;
  if (result.status !== 'ok' || result.signedIn !== true || typeof result.did !== 'string' || !result.did.startsWith('did:')) {
    return null;
  }
  return {
    did: result.did,
    handle: typeof result.handle === 'string' && result.handle ? result.handle : null,
    verified: result.verified === true,
    admin: result.admin === true && result.verified === true,
  };
}

async function readBackendSession() {
  const response = await fetch(`${BACKEND_API_URL}/me`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) return null;
  return normalizeBackendSession(data);
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

/**
 * Compatibility name retained for existing callers. Identity is now established by
 * the allneeds backend's verified AT Protocol OAuth callback rather than by a browser
 * OAuth client forwarding a DPoP-bound access token to Cloudflare.
 */
export async function initializeBlueskyOAuth() {
  if (initializePromise) return initializePromise;
  initializePromise = (async () => {
    const session = await readBackendSession();
    const loginIntent = consumeLoginIntent();
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

export async function resolveBlueskyHandle(input: string) {
  const handle = normalizeBlueskyHandle(input);
  const url = new URL(`${BACKEND_API_URL}/resolve-handle`);
  url.searchParams.set('handle', handle);

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new Error('We could not check that Bluesky username right now. Please try again.');
  }

  const data = await response.json().catch(() => null) as ResolveHandleResponse | null;
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : '';
    const usernameWasNotFound = response.status === 404
      || /returned (?:400|404)|not found|could not be resolved/i.test(message);
    if (usernameWasNotFound) {
      throw new Error('We could not find that Bluesky username. Check the spelling and try again.');
    }
    throw new Error('Bluesky could not verify that username right now. Please try again.');
  }

  if (data?.status !== 'ok' || typeof data.handle !== 'string' || !data.handle.trim()) {
    throw new Error('Bluesky returned an incomplete username check. Please try again.');
  }
  return normalizeBlueskyHandle(data.handle);
}

export async function signInWithBluesky(input: string) {
  const handle = await resolveBlueskyHandle(input);
  safeStorage('sessionStorage')?.setItem(LOGIN_INTENT_STORAGE_KEY, '1');
  const returnTo = typeof window === 'undefined'
    ? '/inventory/'
    : `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginUrl = new URL(`${BACKEND_BASE_URL}/auth/login`);
  loginUrl.searchParams.set('handle', handle);
  loginUrl.searchParams.set('returnTo', returnTo);
  window.location.assign(loginUrl.toString());
}

export async function signOutFromBluesky() {
  try {
    await fetch(`${BACKEND_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    currentSession = null;
    initializePromise = null;
    publishSession(null, 'signout');
  }
}

async function buildCurrentBrowserBackup() {
  const storage = safeStorage('localStorage');
  const localStorage = storage ? captureBrowserStorage(storage) : {};
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
  return session;
}

export async function saveCurrentBrowserToProfile(
  onProgress?: (progress: ProfileSaveProgress) => void,
): Promise<ProfileSaveResult> {
  await requireBackendSession();
  const snapshot = await buildCurrentBrowserBackup();
  const strategies = profilePublishableStrategies(snapshot.inventory);
  const response = await fetch(`${BACKEND_API_URL}/profile/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      key: BACKEND_SNAPSHOT_KEY,
      value: JSON.stringify(snapshot),
      strategies,
    }),
  });
  if (!response.ok) {
    throw new Error('Unable to save this browser to your profile.');
  }

  const decoder = new TextDecoder();
  const reader = response.body?.getReader();
  let buffer = '';
  const saveState: { profileSavedAt: string; syncData: ProfileSaveEvent | null } = {
    profileSavedAt: '',
    syncData: null,
  };
  const acceptEvent = (line: string) => {
    if (!line.trim()) return;
    let event: ProfileSaveEvent;
    try { event = JSON.parse(line) as ProfileSaveEvent; } catch { return; }
    if (event.stage === 'profile-saved' && typeof event.savedAt === 'string' && !Number.isNaN(Date.parse(event.savedAt))) {
      saveState.profileSavedAt = event.savedAt;
      onProgress?.({
        stage: 'syncing-strategies',
        profileSavedAt: saveState.profileSavedAt,
        strategyCount: strategies.length,
      });
    }
    if (event.stage === 'complete') saveState.syncData = event;
  };
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        lines.forEach(acceptEvent);
        if (done) break;
      }
      acceptEvent(buffer);
    } catch (error) {
      // Once the first streamed event arrives, the snapshot is durable even if the
      // connection drops before strategy reconciliation can report completion.
      if (!saveState.profileSavedAt) throw error;
    }
  } else {
    buffer = await response.text();
    buffer.split('\n').forEach(acceptEvent);
  }

  if (!saveState.profileSavedAt && typeof saveState.syncData?.savedAt === 'string' && !Number.isNaN(Date.parse(saveState.syncData.savedAt))) {
    saveState.profileSavedAt = saveState.syncData.savedAt;
  }
  if (!saveState.profileSavedAt) throw new Error('Unable to confirm when this browser was saved to your profile.');

  const strategiesSynced = saveState.syncData?.status === 'ok';
  const strategiesSyncedAt = strategiesSynced
    ? (typeof saveState.syncData?.syncedAt === 'string' && !Number.isNaN(Date.parse(saveState.syncData.syncedAt))
        ? saveState.syncData.syncedAt
        : new Date().toISOString())
    : null;
  const strategyCount = typeof saveState.syncData?.syncedCount === 'number' ? saveState.syncData.syncedCount : strategies.length;
  return {
    profileSavedAt: saveState.profileSavedAt,
    strategiesSynced,
    strategiesSyncedAt,
    strategyCount,
    changedStrategyCount: typeof saveState.syncData?.changedCount === 'number' ? saveState.syncData.changedCount : null,
    unchangedStrategyCount: typeof saveState.syncData?.unchangedCount === 'number' ? saveState.syncData.unchangedCount : null,
    unpublishedStrategyCount: typeof saveState.syncData?.unpublished === 'number' ? saveState.syncData.unpublished : null,
  };
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
  const session = await requireBackendSession();
  publishProfileReview({ phase: 'loading', did: session.did });
  try {
    const response = await fetch(`${BACKEND_API_URL}/user-settings`, { credentials: 'include', cache: 'no-store' });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok || !data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') {
      throw new Error('Unable to load your saved profile. Your device data has been left in place.');
    }
    if (getBlueskySession()?.did !== session.did || profileReview?.phase !== 'loading' || profileReview.did !== session.did) return 'canceled' as const;
    const backup = extractProfileSnapshot(data);
    if (!backup) {
      const settings = (data as { settings?: unknown }).settings;
      if (!Array.isArray(settings) || settings.some((setting) => setting && typeof setting === 'object' && (setting as { key?: unknown }).key === BACKEND_SNAPSHOT_KEY)) {
        throw new Error('The saved profile is unreadable. Your device data has been left in place.');
      }
      publishProfileReview({ phase: 'done', did: session.did, message: 'No saved profile yet. Everything you saved on this device is still here.' });
      return 'empty' as const;
    }
    if (backup.version !== undefined && backup.version !== 1) throw new Error('The saved profile uses an unsupported format. Your device data has been left in place.');
    const comparison = compareProfileSnapshots(captureBrowserStorage(window.localStorage), profileBrowserSnapshot(backup.localStorage));
    if (!profileHasDifferences(comparison)) {
      publishProfileReview({ phase: 'done', did: session.did, message: 'This device and your saved profile already match.' });
      return 'matching' as const;
    }
    publishProfileReview({ phase: 'ready', did: session.did, comparison });
    return 'review' as const;
  } catch (error) {
    if (getBlueskySession()?.did === session.did && profileReview) {
      publishProfileReview({ phase: 'error', did: session.did, message: error instanceof Error ? error.message : 'Unable to compare your saved profile. Your device data has been left in place.' });
    }
    throw error;
  }
}

export async function notifySharedStrategyAdded(strategyId: string) {
  const response = await fetch(`${BACKEND_API_URL}/strategies/${encodeURIComponent(strategyId)}/add-to-inventory`, {
    method: 'POST', credentials: 'include', cache: 'no-store',
  });
  if (!response.ok) throw new Error('Unable to update the shared add count.');
}

function isVerifiedAuthReturn() {
  if (typeof window === 'undefined') return false;
  return new URL(window.location.href).searchParams.get('auth') === 'verified';
}

function clearVerifiedAuthReturn() {
  if (typeof window === 'undefined' || !isVerifiedAuthReturn()) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('auth');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function initializeBlueskyForCurrentPage() {
  if (typeof window === 'undefined') return;
  const hint = safeStorage('localStorage')?.getItem(SESSION_HINT_STORAGE_KEY) ?? '';
  const returningFromLogin = isVerifiedAuthReturn() || hasLoginIntent();
  const mustInitialize = returningFromLogin || hint === 'active';
  if (!mustInitialize) return;
  if (!returningFromLogin && currentSession && Date.now() - currentSessionCheckedAt <= SESSION_CACHE_FRESH_MS) {
    window.allneedsSession = currentSession;
    return;
  }

  void initializeBlueskyOAuth().then(async (session) => {
    if (!session) {
      if (returningFromLogin) publishProfileReview({ phase: 'error', did: '', message: 'Sign-in did not finish in this browser. Your device data is still here. You can download a backup and try signing in again.' });
      return;
    }
    if (returningFromLogin) {
      clearVerifiedAuthReturn();
      await loadProfileIntoCurrentBrowser();
    }
  }).catch((error) => {
    if (returningFromLogin && !profileReview) {
      publishProfileReview({ phase: 'error', did: getBlueskySession()?.did ?? '', message: error instanceof Error ? error.message : 'Unable to check sign-in. Your device data has been left in place.' });
    }
  });
}

declare global {
  interface Window {
    allneedsSession?: BlueskySession | null;
  }
}
