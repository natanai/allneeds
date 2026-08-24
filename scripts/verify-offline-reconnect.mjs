import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import { chromium } from '@playwright/test';
import { preview } from 'vite';

const host = '127.0.0.1';
const port = 4192;
const origin = `http://${host}:${port}`;
const execFileAsync = promisify(execFile);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function startPreview() {
  return preview({
    preview: {
      host,
      port,
      strictPort: true,
    },
  });
}

async function regenerateServiceWorker() {
  await execFileAsync(process.execPath, ['scripts/generate-service-worker.mjs']);
}

async function expectShell(page, label) {
  await page.locator('html[data-app-state="ready"]').waitFor({ timeout: 15_000 });
  await page.locator('[aria-label="Primary navigation magnets"][data-ready="true"]')
    .waitFor({ timeout: 10_000 });
  const mainCount = await page.locator('main').count();
  const actualLabel = await page.locator('main').getAttribute('aria-label');
  invariant(mainCount === 1, `Expected one main landmark for ${label}; received ${mainCount}.`);
  invariant(actualLabel === label, `Expected main label “${label}”; received “${actualLabel}”.`);
}

async function shellCacheNames(page) {
  return page.evaluate(async () => (await caches.keys())
    .filter((name) => name.startsWith('allneeds-v2-shell-')));
}

async function waitForShellCacheReplacement(page, previous) {
  await page.waitForFunction(async (oldNames) => {
    const current = (await caches.keys()).filter((name) => name.startsWith('allneeds-v2-shell-'));
    const hasNewCache = current.some((name) => !oldNames.includes(name));
    const oldCachesRemoved = oldNames.every((name) => !current.includes(name));
    const registration = await navigator.serviceWorker.getRegistration();
    return hasNewCache
      && oldCachesRemoved
      && registration?.active?.state === 'activated'
      && !registration.installing
      && !registration.waiting;
  }, previous, { timeout: 20_000 });

  const current = await shellCacheNames(page);
  const replacement = current.find((name) => !previous.includes(name));
  invariant(replacement, 'The activated service worker did not leave a replacement shell cache.');
  return replacement;
}

async function cacheContainsFreshProbe(page, cacheName) {
  return page.evaluate(async ({ name, appOrigin }) => {
    const cache = await caches.open(name);
    const response = await cache.match(`${appOrigin}/index.html`, { ignoreVary: true });
    return response ? (await response.text()).includes('data-deployment-probe="fresh"') : false;
  }, { name: cacheName, appOrigin: origin });
}

let server = null;
let browser = null;
let indexPath = null;
let deployedIndex = null;

try {
  server = await startPreview();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('https://backend.allneeds.app/api/strategies/feed**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', strategies: [] }),
    });
  });
  const runtimeProblems = [];
  const observeRuntime = (page) => {
    page.on('pageerror', (error) => runtimeProblems.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        runtimeProblems.push(`${message.type()}: ${message.text()}`);
      }
    });
  };

  const page = await context.newPage();
  observeRuntime(page);
  await page.goto(`${origin}/?diagnostics=1`);
  await expectShell(page, 'Home');
  await page.locator('html[data-offline-cache="ready"]').waitFor({ timeout: 20_000 });

  indexPath = resolve('dist/index.html');
  deployedIndex = await readFile(indexPath, 'utf8');
  const previousCaches = await shellCacheNames(page);
  await writeFile(indexPath, deployedIndex.replace('<html', '<html data-deployment-probe="fresh"'));
  await regenerateServiceWorker();

  // The installed shell remains instant while its normal registration discovers the
  // new worker. Wait for install + activate (old cache removed), then prove that the
  // replacement cache itself contains the new shell before removing the network.
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
  await expectShell(page, 'Home');
  const replacementCache = await waitForShellCacheReplacement(page, previousCaches);
  invariant(
    await cacheContainsFreshProbe(page, replacementCache),
    'The replacement versioned cache did not contain the fresh deployment shell.',
  );

  // With the server stopped there is no network fallback that can make this pass.
  // A successful fresh-marker navigation therefore proves the activated versioned
  // shell cache owns repeat startup as intended.
  await server.close();
  server = null;
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
  await expectShell(page, 'Home');
  invariant(
    await page.locator('html').getAttribute('data-deployment-probe') === 'fresh',
    'The activated versioned cache did not serve the fresh shell while the network was unavailable.',
  );

  server = await startPreview();
  await page.goto(`${origin}/needs/love-caring`);
  await expectShell(page, 'Need for love/caring');

  await server.close();
  server = null;

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
  await expectShell(page, 'Need for love/caring');

  const freshPage = await context.newPage();
  observeRuntime(freshPage);
  await freshPage.goto(`${origin}/observations`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await expectShell(freshPage, 'Observations');

  server = await startPreview();
  const reconnectProbe = await freshPage.evaluate(async () => {
    try {
      const response = await fetch(`/reconnect-probe-${Date.now()}.txt`, { cache: 'no-store' });
      return { reachedServer: true, status: response.status };
    } catch (error) {
      return {
        reachedServer: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  });
  invariant(
    reconnectProbe.reachedServer,
    `The restarted preview did not accept a cache-miss request: ${reconnectProbe.message ?? 'unknown error'}`,
  );

  await freshPage.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
  await expectShell(freshPage, 'Observations');
  invariant(
    runtimeProblems.length === 0,
    `Runtime warnings/errors occurred during outage recovery:\n${runtimeProblems.join('\n')}`,
  );

  await context.close();
  console.log('Verified version-safe cache-first upgrade, stopped-server reload, fresh cached deep link, same-port restart, and cache-miss reconnect.');
} finally {
  if (browser) await browser.close().catch(() => undefined);
  if (server) await server.close().catch(() => undefined);
  if (indexPath && deployedIndex) {
    await writeFile(indexPath, deployedIndex).catch(() => undefined);
    await regenerateServiceWorker().catch(() => undefined);
  }
}
