import { readdir, readFile, stat } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';

import {
  REQUIRED_RUNTIME_PRECACHE_PATHS,
  selectRuntimePrecachePaths,
} from './runtime-precache-policy.mjs';

const root = resolve('.');
const dist = resolve(root, 'dist');
const serviceWorkerPath = resolve(dist, 'service-worker.js');

function fail(message) {
  throw new Error(`Production build verification failed: ${message}`);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

const files = (await listFiles(dist)).sort((a, b) => a.localeCompare(b));
const deployPaths = files
  .filter((path) => path !== serviceWorkerPath)
  .map((path) => `./${relative(dist, path).split(sep).join('/')}`);
const expectedPrecachePaths = selectRuntimePrecachePaths(deployPaths);
const worker = await readFile(serviceWorkerPath, 'utf8');
const manifestMatch = worker.match(/const PRECACHE_PATHS = (\[[\s\S]*?\]);/);
if (!manifestMatch?.[1]) fail('the generated service worker has no readable precache manifest.');

const precachePaths = JSON.parse(manifestMatch[1]);
if (!Array.isArray(precachePaths) || precachePaths.some((path) => typeof path !== 'string')) {
  fail('the service-worker precache manifest is malformed.');
}
if (new Set(precachePaths).size !== precachePaths.length) fail('the precache manifest contains duplicates.');
if (precachePaths.some((path) => /^https?:/i.test(path) || path.includes('allneeds-api'))) {
  fail('the precache manifest contains an external URL or API route.');
}
if (JSON.stringify(precachePaths) !== JSON.stringify(expectedPrecachePaths)) {
  const missing = expectedPrecachePaths.filter((path) => !precachePaths.includes(path));
  const extra = precachePaths.filter((path) => !expectedPrecachePaths.includes(path));
  fail(`the precache manifest differs from the runtime policy (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}).`);
}
for (const requiredPath of REQUIRED_RUNTIME_PRECACHE_PATHS) {
  if (!precachePaths.includes(requiredPath)) fail(`required runtime asset ${requiredPath} is not precached.`);
}
if (precachePaths.some((path) => path.startsWith('./docs/') || path.startsWith('./lib/'))) {
  fail('deploy-only documentation or compatibility libraries leaked into the runtime precache.');
}
if (deployPaths.includes('./data/index.json')) {
  fail('the duplicate public legacy catalog was emitted into the production deployment.');
}
const navigationHandler = worker.match(/if \(request\.mode === 'navigate'\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
const deployOnlyBypassIndex = navigationHandler.indexOf('deployOnlyNavigationRoots.some');
const navigationCacheIndex = navigationHandler.indexOf('cache.match(fallbackUrl');
const navigationFetchIndex = navigationHandler.indexOf('return fetch(request)');
if (deployOnlyBypassIndex < 0
  || navigationCacheIndex < 0
  || navigationFetchIndex < 0
  || deployOnlyBypassIndex > navigationCacheIndex
  || navigationCacheIndex > navigationFetchIndex) {
  fail('installed navigation does not bypass deploy-only documents before preferring the version-matched cached app shell.');
}
if (!worker.includes('await self.skipWaiting()')) {
  fail('a newly installed worker cannot immediately replace an older cached deployment.');
}
if (!worker.includes("cache.match(request, { ignoreVary: true })")
  || !worker.includes("cache.match(fallbackUrl, { ignoreVary: true })")) {
  fail('cache lookups can be defeated by transport-only Vary headers.');
}

const indexHtml = await readFile(resolve(dist, 'index.html'), 'utf8');
const requiredBrandAssets = [
  'icons/app-icon.svg',
  'icons/favicon.svg',
  'icons/favicon-48x48.png',
  'icons/favicon-32x32.png',
  'icons/favicon-16x16.png',
  'icons/favicon.ico',
  'icons/apple-touch-icon.png',
  'icons/android-chrome-192x192.png',
  'icons/android-chrome-512x512.png',
  'icons/safari-pinned-tab.svg',
  'icons/mstile-150x150.png',
  'browserconfig.xml',
  'site.webmanifest',
  'social/og-image-1200x630.png',
  'social/social-card.svg',
];
for (const asset of requiredBrandAssets) {
  const assetPath = resolve(dist, asset);
  if (!files.includes(assetPath) || (await stat(assetPath)).size === 0) {
    fail(`app/social asset ${asset} is missing or empty.`);
  }
}

const requiredBrandMetadata = [
  ['SVG favicon', /rel="icon"[^>]+favicon\.svg(?:\?[^"]*)?"/],
  ['PNG favicon fallback', /rel="icon"[^>]+favicon-32x32\.png(?:\?[^"]*)?"/],
  ['classic favicon fallback', /rel="shortcut icon"[^>]+favicon\.ico(?:\?[^"]*)?"/],
  ['Apple touch icon', /rel="apple-touch-icon"[^>]+apple-touch-icon\.png(?:\?[^"]*)?"/],
  ['Safari pinned-tab icon', /rel="mask-icon"[^>]+safari-pinned-tab\.svg(?:\?[^"]*)?"/],
  ['Windows tile icon', /msapplication-TileImage[^>]+mstile-150x150\.png(?:\?[^"]*)?"/],
  ['Open Graph image', /property="og:image"[^>]+social\/og-image-1200x630\.png(?:\?[^"]*)?"/],
  ['Twitter image', /name="twitter:image"[^>]+social\/og-image-1200x630\.png(?:\?[^"]*)?"/],
];
for (const [label, pattern] of requiredBrandMetadata) {
  if (!pattern.test(indexHtml)) fail(`${label} metadata is missing from index.html.`);
}

const emittedFonts = files.filter((path) => path.endsWith('.woff2'));
if (emittedFonts.length !== 2) fail(`expected two local WOFF2 assets, found ${emittedFonts.length}.`);
for (const font of emittedFonts) {
  if ((await stat(font)).size < 10_000) fail(`${relative(dist, font)} is unexpectedly small.`);
}

// Keep the canonical catalog ownership boundary; Vite function names are not a contract.
const catalogSource = await readFile(resolve(root, 'src/data/catalog.ts'), 'utf8');
if (catalogSource.includes('./generated/legacyData.json')
  || !catalogSource.includes("from 'virtual:allneeds-runtime-catalog'")) {
  fail('the browser catalog module is performing or importing legacy catalog normalization.');
}

// Check that the emitted catalog chunk actually exists and is eagerly preloaded.
const catalogChunks = deployPaths.filter((path) => /^\.\/assets\/catalog-data-[\w-]+\.js$/.test(path));
if (catalogChunks.length !== 1) fail('expected one build-shaped catalog data chunk.');
const catalogChunk = catalogChunks[0].slice(2);
const modulePreloads = [...indexHtml.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)]
  .map((match) => match[1]);
if (!modulePreloads.some((path) => path.endsWith(catalogChunk))) {
  fail('the build-shaped catalog data chunk is not eagerly preloaded.');
}
if (deployPaths.some((path) => /observation(?:_cue|-)guide|observation_cues/i.test(path))) {
  fail('retired Observation data assets were emitted into the production deployment.');
}

const allBuiltText = await Promise.all(
  files
    .filter((path) => /\.(?:html|css|js)$/.test(path))
    .map((path) => readFile(path, 'utf8')),
);
if (allBuiltText.some((text) => /fonts\.(googleapis|gstatic)\.com/i.test(text))) {
  fail('a built HTML/CSS/JS asset still references Google Fonts.');
}

console.log(
  `Verified ${precachePaths.length} runtime-preloaded assets from ${deployPaths.length} deploy files, `
  + `${emittedFonts.length} local fonts, build-shaped catalog data, a cache-first installed shell, `
  + 'catalog preloading, and app/social metadata.',
);
