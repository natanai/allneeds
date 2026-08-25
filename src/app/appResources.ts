import { assetPath } from '../data/catalog';

export type BodyCueAppResources = {
  reverseInference: unknown;
  emotionLibrary: Record<string, { name?: string }>;
  supportData: Record<string, unknown>;
};

export type ObservationAppResources = {
  evaluate: (text: string) => unknown;
  suggest: (text: string, library: unknown, maxEach?: number, options?: object) => unknown;
  fallback: (text: string, cues: unknown, options?: object) => unknown;
  cueLibrary: unknown;
  guide: unknown;
};

export type SharedFeedStrategy = {
  id: string | number;
  authorDid?: string;
  title?: string;
  body?: string;
  createdAt?: string;
  visibility?: 'private' | 'followers' | 'public';
  addCount?: number;
  needIds?: unknown[];
  supportsNeeds?: unknown[];
  needs?: unknown[];
  author?: { displayName?: string; handle?: string; did?: string };
};

export type SharedFeedResources = {
  strategies: SharedFeedStrategy[];
  error: string;
};

let bodyCueResources: BodyCueAppResources | null = null;
let bodyCuePromise: Promise<BodyCueAppResources> | null = null;
let observationResources: ObservationAppResources | null = null;
let observationPromise: Promise<ObservationAppResources> | null = null;
const feedResources = new Map<string, SharedFeedResources>();
const feedPromises = new Map<string, Promise<SharedFeedResources>>();

async function fetchJson(path: string) {
  const response = await fetch(assetPath(path), { cache: 'force-cache' });
  if (!response.ok) throw new Error(`${path} returned ${response.status}.`);
  return response.json() as Promise<unknown>;
}

export function readBodyCueResources() {
  return bodyCueResources;
}

export function loadBodyCueResources() {
  if (bodyCueResources) return Promise.resolve(bodyCueResources);
  if (!bodyCuePromise) {
    bodyCuePromise = Promise.all([
      fetchJson('data/reverse-inference.json'),
      // @ts-expect-error Canonical production data is retained as JavaScript.
      import('../legacy/alexithymia-support-data.js') as Promise<{ EMOTION_LIBRARY?: BodyCueAppResources['emotionLibrary'] }>,
    ]).then(([reverseInference, alexithymiaData]) => {
      bodyCueResources = {
        reverseInference,
        emotionLibrary: alexithymiaData.EMOTION_LIBRARY ?? {},
        supportData: alexithymiaData as unknown as Record<string, unknown>,
      };
      return bodyCueResources;
    }).catch((error: unknown) => {
      bodyCuePromise = null;
      throw error;
    });
  }
  return bodyCuePromise;
}

export function readObservationResources() {
  return observationResources;
}

export function loadObservationResources() {
  if (observationResources) return Promise.resolve(observationResources);
  if (!observationPromise) {
    observationPromise = Promise.all([
      // @ts-expect-error Canonical production logic is intentionally bundled unchanged.
      import('../legacy/observations/observationFormula.js'),
      // @ts-expect-error Canonical production logic is intentionally bundled unchanged.
      import('../legacy/observations/observationSuggest.js'),
      // @ts-expect-error Canonical production logic is intentionally bundled unchanged.
      import('../legacy/observations/observationFallback.js'),
      fetchJson('data/observation-guide.json'),
    ]).then(async ([formulaModule, suggestionModule, fallbackModule, guide]) => {
      const cueLibrary = await suggestionModule.loadCueLibrary(
        assetPath('data/observation_cues.csv'),
        assetPath('data/observation_cue_modules.json'),
      );
      observationResources = {
        evaluate: formulaModule.evaluateObservationFormula,
        suggest: suggestionModule.suggestFromObservation,
        fallback: fallbackModule.computeFallbackSuggestion,
        cueLibrary,
        guide,
      };
      return observationResources;
    }).catch((error: unknown) => {
      observationPromise = null;
      throw error;
    });
  }
  return observationPromise;
}

function feedKey(scope: string, sort: string) {
  return `${scope}:${sort}`;
}

export function readSharedFeedResources(scope: string, sort: string) {
  return feedResources.get(feedKey(scope, sort)) ?? null;
}

export function loadSharedFeedResources(scope: string, sort: string, refresh = false) {
  const key = feedKey(scope, sort);
  if (!refresh && feedResources.has(key)) return Promise.resolve(feedResources.get(key)!);
  if (!refresh && feedPromises.has(key)) return feedPromises.get(key)!;
  const base = import.meta.env.DEV ? '/allneeds-api' : 'https://backend.allneeds.app/api';
  const promise = fetch(`${base}/strategies/feed?scope=${encodeURIComponent(scope)}&sort=${encodeURIComponent(sort)}&limit=100`, {
    credentials: 'include',
    cache: 'no-cache',
  }).then(async (response) => {
    const data: unknown = await response.json();
    if (!response.ok || !data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') {
      throw new Error('Unable to load shared strategies right now.');
    }
    const strategies = Array.isArray((data as { strategies?: unknown }).strategies)
      ? (data as { strategies: SharedFeedStrategy[] }).strategies
      : [];
    const result = { strategies, error: '' };
    feedResources.set(key, result);
    return result;
  }).catch(() => {
    const cached = feedResources.get(key);
    return {
      strategies: cached?.strategies ?? [],
      error: 'Unable to load shared strategies right now.',
    };
  }).finally(() => {
    feedPromises.delete(key);
  });
  feedPromises.set(key, promise);
  return promise;
}

export async function warmAppResources() {
  await Promise.all([
    loadBodyCueResources(),
    loadObservationResources(),
    loadSharedFeedResources('public', 'recent'),
  ]);
}
