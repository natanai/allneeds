import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { App } from './app/App';
import { remainingBootGateMs } from './app/bootTiming';
import { preloadAppAssets } from './app/preloadAppAssets';
import { registerServiceWorker } from './app/registerServiceWorker';
import { markAppReady, startUxMetrics } from './app/uxMetrics';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Unable to find the application root.');
}
const appRoot = root;
startUxMetrics();
registerServiceWorker();

const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL;
const bootStartedAt = Number((window as Window & {
  __ALLNEEDS_BOOT_STARTED_MS__?: number;
}).__ALLNEEDS_BOOT_STARTED_MS__);

async function mountApp() {
  document.documentElement.dataset.appState = 'loading';
  const appReady = Promise.all([
    preloadAppAssets(),
    document.fonts?.ready ?? Promise.resolve(),
  ]).then(() => {
    document.documentElement.dataset.appPreload = 'ready';
  }).catch(() => {
    document.documentElement.dataset.appPreload = 'degraded';
  });
  const gateRemaining = remainingBootGateMs(bootStartedAt, performance.now());
  await Promise.race([
    appReady,
    new Promise<void>((resolve) => window.setTimeout(resolve, gateRemaining)),
  ]);
  if (!document.documentElement.dataset.appPreload) {
    document.documentElement.dataset.appPreload = 'background';
  }

  createRoot(appRoot).render(
    <StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
  window.requestAnimationFrame(() => {
    document.documentElement.dataset.appState = 'ready';
    markAppReady();
  });
}

void mountApp();
