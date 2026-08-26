import { readdir, readFile, stat } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { OBSERVATION_COMPAT_MODULES } from './observation-compat-policy.mjs';
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
const navigationCacheIndex = navigationHandler.indexOf('cache.match(fallbackUrl');
const navigationFetchIndex = navigationHandler.indexOf('return fetch(request)');
if (navigationCacheIndex < 0
  || navigationFetchIndex < 0
  || navigationCacheIndex > navigationFetchIndex) {
  fail('installed navigation does not prefer the version-matched cached app shell before network fallback.');
}
if (!worker.includes('await self.skipWaiting()')) {
  fail('a newly installed worker cannot immediately replace an older cached deployment.');
}
if (!worker.includes("cache.match(request, { ignoreVary: true })")
  || !worker.includes("cache.match(fallbackUrl, { ignoreVary: true })")) {
  fail('cache lookups can be defeated by transport-only Vary headers.');
}

const indexHtml = await readFile(resolve(dist, 'index.html'), 'utf8');
if (/fonts\.(googleapis|gstatic)\.com/i.test(indexHtml)) fail('index.html still depends on Google Fonts.');
if (/Loading page/i.test(indexHtml)) fail('index.html contains a route-loading fallback.');
if (!indexHtml.includes('__ALLNEEDS_BOOT_STARTED_MS__ = performance.now()')) {
  fail('the navigation-wide entrance deadline is not initialized before the app module loads.');
}

const requiredLegacyBrandAssets = [
  'icons/favicon-color.svg',
  'icons/favicon-color-48x48.png',
  'icons/favicon-color-32x32.png',
  'icons/favicon-color-16x16.png',
  'icons/favicon.ico',
  'icons/apple-touch-icon.png',
  'icons/android-chrome-192x192.png',
  'icons/android-chrome-512x512.png',
  'icons/android-chrome-maskable-192x192.png',
  'icons/android-chrome-maskable-512x512.png',
  'icons/safari-pinned-tab.svg',
  'icons/mstile-150x150.png',
  'browserconfig.xml',
  'site.webmanifest',
  'social/og-image-1200x630.png',
  'social/social-card.svg',
  'social/twitter-card-1200x630.png',
];
for (const asset of requiredLegacyBrandAssets) {
  const assetPath = resolve(dist, asset);
  if (!files.includes(assetPath) || (await stat(assetPath)).size === 0) {
    fail(`legacy app/social asset ${asset} is missing or empty.`);
  }
}

const requiredBrandMetadata = [
  ['PNG favicon fallback', /rel="icon"[^>]+favicon-color-32x32\.png\?v=3/],
  ['classic favicon fallback', /rel="shortcut icon"[^>]+favicon\.ico\?v=3/],
  ['Apple touch icon', /rel="apple-touch-icon"[^>]+apple-touch-icon\.png\?v=3/],
  ['Safari pinned-tab icon', /rel="mask-icon"[^>]+safari-pinned-tab\.svg\?v=3/],
  ['Windows tile icon', /msapplication-TileImage[^>]+mstile-150x150\.png\?v=3/],
  ['Open Graph image', /property="og:image"[^>]+social\/og-image-1200x630\.png\?v=3/],
  ['Twitter image', /name="twitter:image"[^>]+social\/twitter-card-1200x630\.png\?v=3/],
];
for (const [label, pattern] of requiredBrandMetadata) {
  if (!pattern.test(indexHtml)) fail(`${label} metadata is missing from index.html.`);
}

const emittedFonts = files.filter((path) => path.endsWith('.woff2'));
if (emittedFonts.length !== 2) fail(`expected two local WOFF2 assets, found ${emittedFonts.length}.`);
for (const font of emittedFonts) {
  if ((await stat(font)).size < 10_000) fail(`${relative(dist, font)} is unexpectedly small.`);
}

const appSource = await readFile(resolve(root, 'src/app/App.tsx'), 'utf8');
if (/\blazy\s*\(|<Suspense\b|Loading page/i.test(appSource)) {
  fail('the route graph contains lazy/Suspense loading UI.');
}

const catalogSource = await readFile(resolve(root, 'src/data/catalog.ts'), 'utf8');
const viteConfigSource = await readFile(resolve(root, 'vite.config.ts'), 'utf8');
if (catalogSource.includes("./generated/legacyData.json")
  || !catalogSource.includes("from 'virtual:allneeds-runtime-catalog'")) {
  fail('the browser catalog module is performing or importing legacy catalog normalization.');
}
if (!viteConfigSource.includes("const runtimeCatalogId = 'virtual:allneeds-runtime-catalog'")
  || !viteConfigSource.includes('function runtimeCatalogSource()')) {
  fail('the legacy-to-runtime catalog transformation is no longer owned by the Vite build.');
}

const mainSource = await readFile(resolve(root, 'src/main.tsx'), 'utf8');
if (!mainSource.includes('remainingBootGateMs(bootStartedAt, performance.now())')
  || !mainSource.includes("dataset.appPreload = 'degraded'")
  || !mainSource.includes("dataset.appPreload = 'background'")) {
  fail('the entrance gate no longer honors its navigation-wide deadline and safe preload fallback.');
}

const appShellSource = await readFile(resolve(root, 'src/app/AppShell.tsx'), 'utf8');
if (!appShellSource.includes('document.title = routePresentation(location.pathname, location.search).documentTitle')
  || !appShellSource.includes('aria-label={presentation.label}')) {
  fail('route transitions no longer provide a deterministic title and named main landmark.');
}
if ((appShellSource.match(/<main\b/g) ?? []).length !== 1) {
  fail('the persistent shell must own exactly one main landmark.');
}

const featureSourceFiles = (await listFiles(resolve(root, 'src/features')))
  .filter((path) => path.endsWith('.tsx'));
const nestedMainSources = [];
for (const path of featureSourceFiles) {
  if (/<main\b/.test(await readFile(path, 'utf8'))) nestedMainSources.push(relative(root, path));
}
if (nestedMainSources.length) {
  fail(`routed feature pages contain nested main landmarks: ${nestedMainSources.join(', ')}.`);
}

const dialogFocusSource = await readFile(resolve(root, 'src/app/useDialogFocus.ts'), 'utf8');
if (!dialogFocusSource.includes("event.key === 'Escape'")
  || !dialogFocusSource.includes("event.key !== 'Tab'")
  || !dialogFocusSource.includes("document.body.style.overflow = 'hidden'")
  || !dialogFocusSource.includes('previousFocus.focus({ preventScroll: true })')) {
  fail('shared modal keyboard, scroll-lock, or focus-restoration behavior is incomplete.');
}

for (const moduleName of OBSERVATION_COMPAT_MODULES) {
  const [bundledSource, compatibilitySource] = await Promise.all([
    readFile(resolve(root, 'src/legacy/observations', moduleName), 'utf8'),
    readFile(resolve(dist, 'lib', moduleName), 'utf8'),
  ]);
  if (bundledSource !== compatibilitySource) {
    fail(`emitted Observation compatibility module ${moduleName} drifted from its canonical bundled source.`);
  }
}

const cueCompilerPath = resolve(root, 'src/legacy/observations/observationCueData.js');
const cueCompiler = await import(pathToFileURL(cueCompilerPath).href);
const [observationCueCsv, observationModuleJson] = await Promise.all([
  readFile(resolve(root, 'public/data/observation_cues.csv'), 'utf8'),
  readFile(resolve(root, 'public/data/observation_cue_modules.json'), 'utf8'),
]);
const observationCues = cueCompiler.parseObservationCueCSV(observationCueCsv);
const observationModules = cueCompiler.parseObservationCueModules(observationModuleJson);
const invalidModuleRegexes = observationModules
  .flatMap((module) => (Array.isArray(module.detectors) ? module.detectors : []))
  .filter((detector) => detector?.type === 'regex')
  .filter((detector) => {
    try {
      new RegExp(detector.pattern, detector.flags ?? 'i');
      return false;
    } catch {
      return true;
    }
  });
if (invalidModuleRegexes.length) {
  fail(`${invalidModuleRegexes.length} Observation module regexes cannot compile.`);
}
const observationLibrary = cueCompiler.compileObservationCueLibrary({
  cues: observationCues,
  modules: observationModules,
});
if (observationCues.length < 100
  || observationCues.some((cue) => !cue.patterns.length)
  || observationLibrary.modules.length < 50
  || observationLibrary.modules.some((module) => !module.matchers.length)) {
  fail('the preloaded Observation cue library is incomplete or silently skipped detectors.');
}

const appShellStyles = await readFile(resolve(root, 'src/app/AppShell.module.css'), 'utf8');
const compactAppShellStyles = appShellStyles.match(/@media \(max-width: 640px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
if (!/\.customizerButton\s*\{\s*display:\s*none;?\s*\}/.test(compactAppShellStyles)) {
  fail('the duplicate floating customizer control is visible in the compact app shell.');
}

const observationsSource = await readFile(resolve(root, 'src/features/observations/ObservationsPage.tsx'), 'utf8');
const observationFooterIndex = observationsSource.indexOf(`<footer className={styles.footer}>`);
const observationRecipeIndex = observationsSource.indexOf(`<details className={styles.recipeDisclosure}>`);
const observationOverviewIndex = observationsSource.indexOf(`<section className={styles.overview}>`);
if (observationRecipeIndex < 0
  || observationFooterIndex < observationRecipeIndex
  || observationOverviewIndex < observationFooterIndex) {
  fail('Observation recipe or secondary guidance has drifted out of the current editor-first workflow.');
}
if (!observationsSource.includes('guideOpen ? <div className={styles.guideCard}>')
  || !observationsSource.includes('<ObservationRecipe onOpenGuide={openGuide} />')) {
  fail('the preloaded Observation guide performs hidden DOM work before the user opens it.');
}

const observationStyles = await readFile(resolve(root, 'src/features/observations/ObservationsPage.module.css'), 'utf8');
if (!/\.recipeDisclosure\s*\{[^}]*overflow:\s*hidden;/.test(observationStyles)
  || !/\.recipeDisclosure\s*>\s*summary\s*\{[^}]*cursor:\s*pointer;/.test(observationStyles)
  || !/@media \(max-width: 640px\)[\s\S]*?\.recipeDisclosure\s*>\s*summary/.test(observationStyles)) {
  fail('the Observation recipe is no longer a compact progressive disclosure.');
}

const feedSource = await readFile(resolve(root, 'src/features/feed/FeedPage.tsx'), 'utf8');
if (!feedSource.includes(`<option value="follows" disabled={!session}>From people you follow</option>`)
  || !feedSource.includes(`'Following requires Bluesky sign-in in Menu → Account & data.'`)
  || !feedSource.includes('await notifySharedStrategyAdded(strategyId)')) {
  fail('the Shared strategies account boundary, follower feed, or backend add-count path has drifted.');
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
  + 'an eager route graph, a clean Observation matcher, route semantics, modal focus behavior, and compact-workflow guards.',
);
