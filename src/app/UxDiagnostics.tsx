import { useEffect, useState } from 'react';

import { readUxMetrics, UX_METRICS_EVENT } from './uxMetrics';
import type { UxMetrics } from './uxMetrics';
import {
  OFFLINE_CACHE_EVENT,
  readOfflineCacheState,
} from './registerServiceWorker';
import type { OfflineCacheState } from './registerServiceWorker';
import styles from './UxDiagnostics.module.css';

function display(value: number | null, suffix = '') {
  return value === null ? 'Waiting…' : `${value}${suffix}`;
}

export function UxDiagnostics() {
  const [enabled] = useState(
    () => new URLSearchParams(window.location.search).get('diagnostics') === '1',
  );
  const [metrics, setMetrics] = useState(readUxMetrics);
  const [offlineCache, setOfflineCache] = useState(readOfflineCacheState);

  useEffect(() => {
    if (!enabled) return undefined;
    const update = (event: Event) => {
      setMetrics((event as CustomEvent<UxMetrics>).detail ?? readUxMetrics());
    };
    const updateOfflineCache = (event: Event) => {
      setOfflineCache((event as CustomEvent<OfflineCacheState>).detail ?? readOfflineCacheState());
    };
    window.addEventListener(UX_METRICS_EVENT, update);
    window.addEventListener(OFFLINE_CACHE_EVENT, updateOfflineCache);
    return () => {
      window.removeEventListener(UX_METRICS_EVENT, update);
      window.removeEventListener(OFFLINE_CACHE_EVENT, updateOfflineCache);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <aside className={styles.panel} aria-label="Local UX metrics">
      <header>
        <strong>Local UX metrics</strong>
        <span>Never transmitted</span>
      </header>
      <dl>
        <div><dt>App ready</dt><dd>{display(metrics.appReadyMs, ' ms')}</dd></div>
        <div><dt>LCP</dt><dd>{display(metrics.largestContentfulPaintMs, ' ms')}</dd></div>
        <div><dt>Current-view CLS</dt><dd>{metrics.cumulativeLayoutShift}</dd></div>
        <div><dt>Max interaction</dt><dd>{display(metrics.maxInteractionDurationMs, ' ms')}</dd></div>
        <div><dt>Last route</dt><dd>{display(metrics.lastRouteResponseMs, ' ms')}</dd></div>
        <div><dt>Max route</dt><dd>{display(metrics.maxRouteResponseMs, ' ms')}</dd></div>
        <div><dt>Offline cache</dt><dd>{offlineCache}</dd></div>
      </dl>
    </aside>
  );
}
