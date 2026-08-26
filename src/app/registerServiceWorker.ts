export const OFFLINE_CACHE_EVENT = 'allneeds:offline-cache';
export type OfflineCacheState = 'development' | 'unsupported' | 'registering' | 'ready' | 'error';

function publish(state: OfflineCacheState) {
  document.documentElement.dataset.offlineCache = state;
  window.dispatchEvent(new CustomEvent(OFFLINE_CACHE_EVENT, { detail: state }));
}

export function readOfflineCacheState(): OfflineCacheState {
  const value = document.documentElement.dataset.offlineCache;
  if (value === 'development' || value === 'unsupported' || value === 'registering'
    || value === 'ready' || value === 'error') return value;
  return import.meta.env.DEV ? 'development' : 'registering';
}

export function registerServiceWorker() {
  if (import.meta.env.DEV) {
    publish('development');
    return;
  }
  if (!('serviceWorker' in navigator)) {
    publish('unsupported');
    return;
  }

  publish('registering');

  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  void navigator.serviceWorker.register(`${base}service-worker.js`, {
      scope: base,
      updateViaCache: 'none',
    })
    .then(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          const ready = () => resolve();
          navigator.serviceWorker.addEventListener('controllerchange', ready, { once: true });
          window.setTimeout(resolve, 10_000);
        });
      }
      publish(navigator.serviceWorker.controller ? 'ready' : 'error');
    })
    .catch(() => {
      publish('error');
      // The application remains fully usable if private mode or policy blocks caching.
    });
}
