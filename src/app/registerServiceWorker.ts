export const OFFLINE_CACHE_EVENT = 'allneeds:offline-cache';
export type OfflineCacheState = 'development' | 'unsupported' | 'registering' | 'ready' | 'error';
export type AppUpdateCheck = 'checked' | 'unavailable' | 'timed-out';

function serviceWorkerBase() {
  return import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
}

function waitForActivation(worker: ServiceWorker, timeoutMs: number): Promise<AppUpdateCheck> {
  if (worker.state === 'activated') return Promise.resolve('checked');
  return new Promise((resolve) => {
    const finish = (result: AppUpdateCheck) => {
      window.clearTimeout(timeoutId);
      worker.removeEventListener('statechange', stateChanged);
      resolve(result);
    };
    const stateChanged = () => {
      if (worker.state === 'activated') finish('checked');
      else if (worker.state === 'redundant') finish('unavailable');
    };
    const timeoutId = window.setTimeout(() => finish('timed-out'), Math.max(0, timeoutMs));
    worker.addEventListener('statechange', stateChanged);
  });
}

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

export async function requestServiceWorkerUpdate(): Promise<AppUpdateCheck> {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return 'unavailable';
  const registration = await navigator.serviceWorker.getRegistration(serviceWorkerBase()).catch(() => null);
  if (!registration) return 'unavailable';

  const startedAt = Date.now();
  let timeoutId = 0;
  const timedOut = new Promise<'timed-out'>((resolve) => {
    timeoutId = window.setTimeout(() => resolve('timed-out'), 8_000);
  });
  let checked: Promise<'checked' | 'unavailable'>;
  try {
    checked = registration.update()
      .then(() => 'checked' as const)
      .catch(() => 'unavailable' as const);
  } catch {
    window.clearTimeout(timeoutId);
    return 'unavailable';
  }
  const result = await Promise.race([checked, timedOut]);
  window.clearTimeout(timeoutId);
  if (result !== 'checked') return result;
  const replacement = registration.installing ?? registration.waiting;
  if (!replacement) return 'checked';
  return waitForActivation(replacement, 8_000 - (Date.now() - startedAt));
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

  const base = serviceWorkerBase();
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
