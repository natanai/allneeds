import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { App } from './app/App';
import { remainingBootGateMs } from './app/bootTiming';
import { waitForAppShellVisualReady } from './app/bootReadiness';
import { preloadAppAssets } from './app/preloadAppAssets';
import { registerServiceWorker } from './app/registerServiceWorker';
import { markAppReady, startUxMetrics } from './app/uxMetrics';
import { initializeBlueskyForCurrentPage } from './features/account/blueskyAccount';
import { applyThemeToRoot, readTheme, THEME_CHANGED_EVENT, THEME_KEY } from './features/customizer/customizerSettings';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

const applyStoredTheme = () => applyThemeToRoot(readTheme());
applyStoredTheme();
window.addEventListener(THEME_CHANGED_EVENT, applyStoredTheme);
window.addEventListener('storage', (event) => {
  if (!event.key || event.key === THEME_KEY) applyStoredTheme();
});
initializeBlueskyForCurrentPage();

const root = document.getElementById('root');

if (!root) {
  throw new Error('Unable to find the application root.');
}
const appRoot = root;
const diagnosticsEnabled = new URLSearchParams(window.location.search).get('diagnostics') === '1';
if (diagnosticsEnabled) startUxMetrics();
registerServiceWorker();

const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL;
const bootStartedAt = Number((window as Window & {
  __ALLNEEDS_BOOT_STARTED_MS__?: number;
}).__ALLNEEDS_BOOT_STARTED_MS__);

function dismissBootOverlay() {
  const overlay = document.getElementById('app-boot');
  if (!overlay) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    overlay.remove();
    return;
  }

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    overlay.remove();
  };

  overlay.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'opacity') remove();
  }, { once: true });
  window.setTimeout(remove, 260);
}

async function mountApp() {
  document.documentElement.dataset.appState = 'loading';

  const localPreparation = Promise.all([
    preloadAppAssets(),
    document.fonts?.ready ?? Promise.resolve(),
  ]).then(() => {
    document.documentElement.dataset.appPreload = 'ready';
  }).catch(() => {
    document.documentElement.dataset.appPreload = 'degraded';
  });

  createRoot(appRoot).render(
    <StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );

  const visuallyReady = Promise.all([
    localPreparation,
    waitForAppShellVisualReady(),
  ]);
  const gateRemaining = remainingBootGateMs(bootStartedAt, performance.now());

  await Promise.race([
    visuallyReady,
    new Promise<void>((resolve) => window.setTimeout(resolve, gateRemaining)),
  ]);

  if (!document.documentElement.dataset.appPreload) {
    document.documentElement.dataset.appPreload = 'background';
  }

  window.requestAnimationFrame(() => {
    document.documentElement.dataset.appState = 'ready';
    dismissBootOverlay();
    markAppReady();
  });
}

void mountApp();
