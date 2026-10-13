import { useEffect, useState, useSyncExternalStore } from 'react';

import { captureBrowserStorage } from '../../persistence/browserBackup';
import { synchronizeCustomizerMirrors } from '../customizer/customizerSettings';
import { readInventory } from '../inventory/inventoryRepository';
import { readJournal, JOURNAL_STORAGE_KEY } from '../journal/journalRepository';
import { markProfileBackedUp, readProfileBackupReceipt } from './profileBackupStatus';
import { profilePublishableStrategies } from './profileStrategySync';
import {
  applyCombinedProfile,
  applyProfileReplacement,
  combineProfileSnapshots,
  compareProfileSnapshots,
  profileBrowserSnapshot,
  profileHasDifferences,
  snapshotStorage,
  type ProfileComparison,
} from './profileReconciliation';

const BACKEND_BASE_URL = 'https://backend.allneeds.app';
const BACKEND_API_URL = `${BACKEND_BASE_URL}/api`;
const BACKEND_SNAPSHOT_KEY = 'allneeds_export_v1';
const LOGIN_INTENT_STORAGE_KEY = 'allneeds:bsky-login-intent';
const SESSION_HINT_STORAGE_KEY = 'allneeds:bsky-session-hint';
const SESSION_CACHE_STORAGE_KEY = 'allneeds:bsky-session-cache-v1';
const HOME_SCREEN_HANDOFF_STORAGE_KEY = 'allneeds:home-screen-sign-in-v1';
const SESSION_CACHE_FRESH_MS = 60 * 60 * 1_000;
const HOME_SCREEN_HANDOFF_MAX_AGE_MS = 20 * 60 * 1_000;
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

type PendingHomeScreenHandoff = {
  version: 1;
  handoff: string;
  secret: string;
  createdAt: number;
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
  | { phase: 'handoff-return'; did: '' }
  | { phase: 'handoff-loading'; did: '' }
  | { phase: 'handoff-waiting'; did: ''; message: string }
  | { phase: 'loading'; did: string }
  | { phase: 'ready'; did: string; comparison: ProfileComparison }
  | { phase: 'error'; did: string; message: string }
  | { phase: 'save-error'; did: string; message: string }
  | { phase: 'done'; did: string; message: string; changed?: boolean };
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
  if (profileReview?.phase === 'handoff-return') clearVerifiedAuthReturn();
  if (profileReview?.phase === 'handoff-loading' || profileReview?.phase === 'handoff-waiting') clearPendingHomeScreenHandoff();
  publishProfileReview(null);
}

export async function mergeReviewedProfileIntoAccount() {
  if (profileReview?.phase !== 'ready') throw new Error('Review your saved profile first.');
  const review = profileReview;
  if (getBlueskySession()?.did !== review.did) throw new Error('Your account changed. Review the saved profile again.');
  const combined = applyCombinedProfile(window.localStorage, review.comparison, 'profile', review.did);
  synchronizeCustomizerMirrors(combined);
  try {
    const result = await saveCurrentBrowserToProfile();
    publishProfileReview({
      phase: 'done',
      did: review.did,
      changed: true,
      message: result.strategiesSynced
        ? 'Local entries were merged into your saved profile.'
        : 'Local entries were saved to your profile. Shared strategy updates did not finish.',
    });
  } catch {
    publishProfileReview({
      phase: 'save-error',
      did: review.did,
      message: 'Your entries were merged in this browser, but the profile could not be updated. Try saving again.',
    });
  }
}

export async function retryMergedProfileSave() {
  if (profileReview?.phase !== 'save-error') throw new Error('There is no pending profile save.');
  const review = profileReview;
  if (getBlueskySession()?.did !== review.did) throw new Error('Your account changed. Sign in again before saving.');
  try {
    const result = await saveCurrentBrowserToProfile();
    publishProfileReview({
      phase: 'done',
      did: review.did,
      changed: true,
      message: result.strategiesSynced
        ? 'Local entries were merged into your saved profile.'
        : 'Local entries were saved to your profile. Shared strategy updates did not finish.',
    });
  } catch {
    publishProfileReview({ ...review, message: 'The profile still could not be updated. Your merged entries remain safe in this browser.' });
  }
}

export async function replaceBrowserWithReviewedProfile() {
  if (profileReview?.phase !== 'ready') throw new Error('Check your saved profile first.');
  const review = profileReview;
  if (getBlueskySession()?.did !== review.did) throw new Error('Your account changed. Check the saved profile again.');
  const replacement = applyProfileReplacement(window.localStorage, review.comparison, review.did);
  synchronizeCustomizerMirrors(replacement);
  publishProfileReview({ phase: 'done', did: review.did, changed: true, message: 'Your saved profile was loaded.' });
}

if (typeof window !== 'undefined' && currentSession) {
  window.allneedsSession = currentSession;
  writeSessionHint(true);
}

function safeStorage(name: 'localStorage' | 'sessionStorage') {
  if (typeof window === 'undefined') return null;
  try { return window[name]; } catch { return null; }
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function randomHandoffToken() {
  return encodeBase64Url(window.crypto.getRandomValues(new Uint8Array(32)));
}

async function handoffProof(secret: string) {
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return encodeBase64Url(new Uint8Array(digest));
}

export function isInstalledHomeScreenApp() {
  if (typeof window === 'undefined') return false;
  const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean };
  return standaloneNavigator.standalone === true
    || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

function readPendingHomeScreenHandoff(): PendingHomeScreenHandoff | null {
  const storage = safeStorage('localStorage');
  if (!storage) return null;
  try {
    const parsed: unknown = JSON.parse(storage.getItem(HOME_SCREEN_HANDOFF_STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const pending = parsed as Partial<PendingHomeScreenHandoff>;
    if (pending.version !== 1
      || typeof pending.handoff !== 'string'
      || !/^[A-Za-z0-9_-]{43}$/u.test(pending.handoff)
      || typeof pending.secret !== 'string'
      || !/^[A-Za-z0-9_-]{43}$/u.test(pending.secret)
      || typeof pending.createdAt !== 'number') return null;
    const age = Date.now() - pending.createdAt;
    if (age < 0 || age > HOME_SCREEN_HANDOFF_MAX_AGE_MS) {
      storage.removeItem(HOME_SCREEN_HANDOFF_STORAGE_KEY);
      return null;
    }
    return pending as PendingHomeScreenHandoff;
  } catch { return null; }
}

function clearPendingHomeScreenHandoff() {
  try { safeStorage('localStorage')?.removeItem(HOME_SCREEN_HANDOFF_STORAGE_KEY); } catch { /* Optional cleanup. */ }
}

async function createPendingHomeScreenHandoff() {
  const storage = safeStorage('localStorage');
  if (!storage) throw new Error('A safe home-screen sign-in could not be prepared. Your device data is still here.');
  const pending: PendingHomeScreenHandoff = {
    version: 1,
    handoff: randomHandoffToken(),
    secret: randomHandoffToken(),
    createdAt: Date.now(),
  };
  try { storage.setItem(HOME_SCREEN_HANDOFF_STORAGE_KEY, JSON.stringify(pending)); }
  catch { throw new Error('A safe home-screen sign-in could not be prepared. Your device data is still here.'); }
  return { ...pending, proof: await handoffProof(pending.secret) };
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
  const currentUrl = typeof window === 'undefined' ? null : new URL(window.location.href);
  currentUrl?.searchParams.delete('auth');
  currentUrl?.searchParams.delete('authHandoff');
  const returnTo = currentUrl
    ? `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
    : '/inventory/';
  const loginUrl = new URL(`${BACKEND_BASE_URL}/auth/login`);
  loginUrl.searchParams.set('handle', handle);
  loginUrl.searchParams.set('returnTo', returnTo);
  if (isInstalledHomeScreenApp()) {
    const pending = await createPendingHomeScreenHandoff();
    loginUrl.searchParams.set('handoff', pending.handoff);
    loginUrl.searchParams.set('proof', pending.proof);
  }
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
  // The canonical repositories may migrate older records when read. Capture storage
  // afterwards so the backup includes the migrated journal and inventory keys.
  const inventory = readInventory();
  const journalEntries = readJournal();
  const storage = safeStorage('localStorage');
  const localStorage = storage ? captureBrowserStorage(storage) : {};
  const parse = (key: string) => {
    try { return JSON.parse(localStorage[key] ?? 'null') as unknown; } catch { return null; }
  };
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    inventory,
    journalEntries,
    customizer: {
      theme: parse('nvcApp.theme'),
      navSettings: parse('nvcApp.navSettings'),
    },
    localStorage,
  };
}

type CurrentBrowserBackup = Awaited<ReturnType<typeof buildCurrentBrowserBackup>>;

// Automatic journal backups may not replace cloud-only data (including strategies,
// settings, and entries saved on another device). Merge with the current profile first.
async function reconcileJournalAutoBackup(device: CurrentBrowserBackup, did: string): Promise<CurrentBrowserBackup> {
  const response = await fetch(`${BACKEND_API_URL}/user-settings`, {
    credentials: 'include', cache: 'no-store',
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') {
    throw new Error('Could not check the latest profile before backing up the journal. Your entry is still saved on this device.');
  }
  const profile = extractProfileSnapshot(data);
  if (!profile) {
    const settings = (data as { settings?: unknown }).settings;
    if (!Array.isArray(settings) || settings.some((setting) => setting && typeof setting === 'object'
      && (setting as { key?: unknown }).key === BACKEND_SNAPSHOT_KEY)) {
      throw new Error('Saved profile is unreadable; automatic backup stopped to protect existing data.');
    }
    return device;
  }
  const comparison = compareProfileSnapshots(device.localStorage, profileBrowserSnapshot(profile.localStorage));
  const combined = combineProfileSnapshots(comparison, 'profile');

  // A deliberate local deletion may be propagated only when this device has a
  // confirmed prior copy of that entry. Missing cloud-only IDs are not deletions.
  const receipt = readProfileBackupReceipt(did);
  const localIds = new Set(device.journalEntries.map((entry) => entry.id));
  const removed = new Set(Object.keys(receipt?.journalIds ?? {}).filter((id) => !localIds.has(id)));
  if (removed.size) {
    const journal = JSON.parse(combined[JOURNAL_STORAGE_KEY]!) as {
      schemaVersion: number; savedAt: string; data: { entries: Array<{ id: string }> };
    };
    journal.data.entries = journal.data.entries.filter((entry) => !removed.has(entry.id));
    combined[JOURNAL_STORAGE_KEY] = JSON.stringify(journal);
  }

  const mergedStorage = snapshotStorage(combined);
  const parse = (key: string) => {
    try { return JSON.parse(combined[key] ?? 'null') as unknown; } catch { return null; }
  };
  return {
    ...device,
    localStorage: combined,
    journalEntries: readJournal(mergedStorage),
    inventory: readInventory(mergedStorage),
    customizer: {
      theme: parse('nvcApp.theme'),
      navSettings: parse('nvcApp.navSettings'),
    },
  };
}

async function requireBackendSession() {
  const session = getBlueskySession() ?? await initializeBlueskyOAuth();
  if (!session) throw new Error('Sign in with Bluesky first.');
  return session;
}

let profileSaveTail: Promise<void> = Promise.resolve();

export function saveCurrentBrowserToProfile(
  onProgress?: (progress: ProfileSaveProgress) => void,
  mode: 'manual' | 'journal-auto' = 'manual',
): Promise<ProfileSaveResult> {
  // Serializing also prevents a journal autosave racing a manual full backup.
  const task = profileSaveTail.then(() => performProfileSave(onProgress, mode));
  profileSaveTail = task.then(() => {}, () => {});
  return task;
}

async function performProfileSave(
  onProgress: ((progress: ProfileSaveProgress) => void) | undefined,
  mode: 'manual' | 'journal-auto',
): Promise<ProfileSaveResult> {
  const session = await requireBackendSession();
  const deviceSnapshot = await buildCurrentBrowserBackup();
  const snapshot = mode === 'journal-auto'
    ? await reconcileJournalAutoBackup(deviceSnapshot, session.did)
    : deviceSnapshot;
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
      if (getBlueskySession()?.did === session.did) {
        markProfileBackedUp(session.did, event.savedAt, deviceSnapshot.localStorage);
      }
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
    if (getBlueskySession()?.did === session.did) {
      markProfileBackedUp(session.did, saveState.profileSavedAt, deviceSnapshot.localStorage);
    }
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
      publishProfileReview(null);
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

let handoffClaimPromise: Promise<'complete' | 'pending' | 'missing'> | null = null;
let handoffResumeListenersInstalled = false;

export function resumeHomeScreenSignIn(confirmationCode = '') {
  if (handoffClaimPromise) return handoffClaimPromise;
  const pending = readPendingHomeScreenHandoff();
  if (!pending) return Promise.resolve('missing' as const);
  const code = confirmationCode.replace(/\s+/gu, '');
  if (!/^\d{6}$/u.test(code)) {
    publishProfileReview({
      phase: 'handoff-waiting',
      did: '',
      message: 'Enter the 6-digit code shown in Safari after Bluesky verifies your sign-in.',
    });
    return Promise.resolve('pending' as const);
  }
  publishProfileReview({ phase: 'handoff-loading', did: '' });
  handoffClaimPromise = (async (): Promise<'complete' | 'pending' | 'missing'> => {
    let response: Response;
    try {
      response = await fetch(`${BACKEND_BASE_URL}/auth/handoff/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ handoff: pending.handoff, secret: pending.secret, code }),
      });
    } catch {
      publishProfileReview({
        phase: 'handoff-waiting',
        did: '',
        message: 'The app could not check the sign-in yet. Your data is still here.',
      });
      return 'pending';
    }
    if (response.status === 202) {
      publishProfileReview({
        phase: 'handoff-waiting',
        did: '',
        message: 'Bluesky sign-in is not finished yet. Complete it in Safari, then return here.',
      });
      return 'pending';
    }
    const data: unknown = await response.json().catch(() => null);
    const claimedSession = normalizeBackendSession(data);
    if (!response.ok || !claimedSession) {
      const message = data && typeof data === 'object' ? (data as { message?: unknown }).message : null;
      if (response.status === 410) clearPendingHomeScreenHandoff();
      publishProfileReview({
        phase: response.status === 400 && message === 'code_mismatch' ? 'handoff-waiting' : 'error',
        did: '',
        message: response.status === 400 && message === 'code_mismatch'
          ? 'That code did not match. Check the code still shown in Safari and try again.'
          : response.status === 410
            ? 'That sign-in handoff expired. Your home-screen app data is still here. Close this message and sign in again.'
          : 'The app could not finish sign-in. Your home-screen app data is still here.',
      });
      return 'missing';
    }
    const confirmedSession = await readBackendSession();
    if (!confirmedSession || confirmedSession.did !== claimedSession.did) {
      publishProfileReview({
        phase: 'handoff-waiting',
        did: '',
        message: 'The app could not attach the verified sign-in yet. Your data is still here; try checking again.',
      });
      return 'pending';
    }
    clearPendingHomeScreenHandoff();
    try { safeStorage('sessionStorage')?.removeItem(LOGIN_INTENT_STORAGE_KEY); } catch { /* Optional cleanup. */ }
    clearVerifiedAuthReturn();
    publishSession(confirmedSession, 'signin');
    initializePromise = Promise.resolve(confirmedSession);
    await loadProfileIntoCurrentBrowser();
    return 'complete';
  })().finally(() => { handoffClaimPromise = null; });
  return handoffClaimPromise;
}

function installHomeScreenHandoffResumeListeners() {
  if (handoffResumeListenersInstalled || typeof window === 'undefined' || typeof document === 'undefined') return;
  handoffResumeListenersInstalled = true;
  const resume = () => {
    if (document.visibilityState === 'visible' && readPendingHomeScreenHandoff()) {
      void resumeHomeScreenSignIn();
    }
  };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', resume);
  window.addEventListener('focus', resume);
}

function isVerifiedAuthReturn() {
  if (typeof window === 'undefined') return false;
  return new URL(window.location.href).searchParams.get('auth') === 'verified';
}

function homeScreenHandoffFromUrl() {
  if (typeof window === 'undefined') return '';
  return new URL(window.location.href).searchParams.get('authHandoff') ?? '';
}

function clearVerifiedAuthReturn() {
  if (typeof window === 'undefined' || (!isVerifiedAuthReturn() && !homeScreenHandoffFromUrl())) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('auth');
  url.searchParams.delete('authHandoff');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function initializeBlueskyForCurrentPage() {
  if (typeof window === 'undefined') return;
  installHomeScreenHandoffResumeListeners();
  const pendingHandoff = readPendingHomeScreenHandoff();
  const returnedHandoff = homeScreenHandoffFromUrl();
  if (returnedHandoff && pendingHandoff?.handoff !== returnedHandoff) {
    publishProfileReview({ phase: 'handoff-return', did: '' });
    return;
  }
  if (pendingHandoff) {
    void resumeHomeScreenSignIn();
    return;
  }
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
