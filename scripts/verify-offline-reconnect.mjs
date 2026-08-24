import { chromium } from '@playwright/test';
import { preview } from 'vite';

const host = '127.0.0.1';
const port = 4192;
const origin = `http://${host}:${port}`;

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

async function expectShell(page, label) {
  await page.locator('html[data-app-state="ready"]').waitFor({ timeout: 15_000 });
  await page.locator('[aria-label="Primary navigation magnets"][data-ready="true"]')
    .waitFor({ timeout: 10_000 });
  const mainCount = await page.locator('main').count();
  const actualLabel = await page.locator('main').getAttribute('aria-label');
  invariant(mainCount === 1, `Expected one main landmark for ${label}; received ${mainCount}.`);
  invariant(actualLabel === label, `Expected main label “${label}”; received “${actualLabel}”.`);
}

let server = null;
let browser = null;

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
  console.log('Verified stopped-server reload, fresh cached deep link, same-port restart, and cache-miss reconnect.');
} finally {
  if (browser) await browser.close().catch(() => undefined);
  if (server) await server.close().catch(() => undefined);
}
