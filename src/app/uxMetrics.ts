export const UX_METRICS_EVENT = 'allneeds:ux-metrics';

export type UxMetrics = {
  appReadyMs: number | null;
  largestContentfulPaintMs: number | null;
  cumulativeLayoutShift: number;
  maxInteractionDurationMs: number;
  lastRouteResponseMs: number | null;
  maxRouteResponseMs: number;
};

type LayoutShiftEntry = PerformanceEntry & {
  value?: number;
  hadRecentInput?: boolean;
};

type EventTimingEntry = PerformanceEntry & {
  duration?: number;
  interactionId?: number;
};

const metrics: UxMetrics = {
  appReadyMs: null,
  largestContentfulPaintMs: null,
  cumulativeLayoutShift: 0,
  maxInteractionDurationMs: 0,
  lastRouteResponseMs: null,
  maxRouteResponseMs: 0,
};

let started = false;
let pendingRouteIntent: number | null = null;
let pendingRouteExpiry = 0;
let lcpFrozen = false;

function round(value: number, places = 1) {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function publish() {
  const snapshot = readUxMetrics();
  document.documentElement.dataset.uxMetrics = JSON.stringify(snapshot);
  window.dispatchEvent(new CustomEvent(UX_METRICS_EVENT, { detail: snapshot }));
}

function observe(type: string, callback: (entries: PerformanceEntry[]) => void) {
  if (!('PerformanceObserver' in window)
    || !PerformanceObserver.supportedEntryTypes?.includes(type)) return;
  try {
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true });
  } catch {
    // Unsupported metric types never block the application.
  }
}

export function startUxMetrics() {
  if (started) return;
  started = true;

  observe('largest-contentful-paint', (entries) => {
    if (lcpFrozen) return;
    const last = entries.at(-1);
    if (!last) return;
    metrics.largestContentfulPaintMs = round(last.startTime);
    publish();
  });

  observe('layout-shift', (entries) => {
    entries.forEach((entry) => {
      const shift = entry as LayoutShiftEntry;
      if (!shift.hadRecentInput) metrics.cumulativeLayoutShift += shift.value ?? 0;
    });
    metrics.cumulativeLayoutShift = round(metrics.cumulativeLayoutShift, 4);
    publish();
  });

  observe('event', (entries) => {
    entries.forEach((entry) => {
      const event = entry as EventTimingEntry;
      if ((event.interactionId ?? 0) > 0) {
        metrics.maxInteractionDurationMs = Math.max(
          metrics.maxInteractionDurationMs,
          round(event.duration ?? 0),
        );
      }
    });
    publish();
  });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(target instanceof HTMLAnchorElement)) return;
    const destination = new URL(target.href, window.location.href);
    const current = new URL(window.location.href);
    if (destination.origin !== current.origin
      || destination.pathname === current.pathname && destination.search === current.search
      || destination.hash && destination.pathname === current.pathname && destination.search === current.search) return;
    lcpFrozen = true;
    metrics.cumulativeLayoutShift = 0;
    pendingRouteIntent = performance.now();
    pendingRouteExpiry = pendingRouteIntent + 2_000;
  }, true);

  publish();
}

export function markAppReady() {
  metrics.appReadyMs = round(performance.now());
  publish();
  window.setTimeout(() => {
    lcpFrozen = true;
  }, 500);
}

export function markRouteReady() {
  if (pendingRouteIntent === null) return;
  const intent = pendingRouteIntent;
  pendingRouteIntent = null;
  window.requestAnimationFrame(() => {
    if (performance.now() > pendingRouteExpiry) return;
    const response = round(performance.now() - intent);
    metrics.lastRouteResponseMs = response;
    metrics.maxRouteResponseMs = Math.max(metrics.maxRouteResponseMs, response);
    publish();
  });
}

export function readUxMetrics(): UxMetrics {
  return { ...metrics };
}
