import { readdir, readFile, stat } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

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
const publicPaths = files
  .filter((path) => path !== serviceWorkerPath)
  .map((path) => `./${relative(dist, path).split(sep).join('/')}`);
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
if (JSON.stringify(precachePaths) !== JSON.stringify(publicPaths)) {
  const missing = publicPaths.filter((path) => !precachePaths.includes(path));
  const extra = precachePaths.filter((path) => !publicPaths.includes(path));
  fail(`the precache manifest differs from dist (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}).`);
}
const navigationHandler = worker.match(/if \(request\.mode === 'navigate'\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
const navigationFetchIndex = navigationHandler.indexOf('await fetch(request)');
const navigationFallbackIndex = navigationHandler.indexOf('cache.match(fallbackUrl');
if (navigationFetchIndex < 0
  || navigationFallbackIndex < 0
  || navigationFetchIndex > navigationFallbackIndex) {
  fail('online navigation does not prefer the current deployment before falling back to the cached app shell.');
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

const emittedFonts = files.filter((path) => path.endsWith('.woff2'));
if (emittedFonts.length !== 2) fail(`expected two local WOFF2 assets, found ${emittedFonts.length}.`);
for (const font of emittedFonts) {
  if ((await stat(font)).size < 10_000) fail(`${relative(dist, font)} is unexpectedly small.`);
}

const appSource = await readFile(resolve(root, 'src/app/App.tsx'), 'utf8');
if (/\blazy\s*\(|<Suspense\b|Loading page/i.test(appSource)) {
  fail('the route graph contains lazy/Suspense loading UI.');
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

const cueCompilerPath = resolve(root, 'src/legacy/observations/observationCueData.js');
const publicCueCompilerPath = resolve(root, 'public/lib/observationCueData.js');
const [cueCompilerSource, publicCueCompilerSource] = await Promise.all([
  readFile(cueCompilerPath, 'utf8'),
  readFile(publicCueCompilerPath, 'utf8'),
]);
if (cueCompilerSource !== publicCueCompilerSource) {
  fail('the bundled and public Observation cue compilers have drifted apart.');
}
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
if (!feedSource.includes(`<p className={styles.authHint}>Following requires Bluesky sign-in in Menu → Account &amp; data.</p>`)) {
  fail('the local Shared strategies boundary no longer points sign-in intent to Menu → Account & data.');
}

const allBuiltText = await Promise.all(
  files
    .filter((path) => /\.(?:html|css|js)$/.test(path))
    .map((path) => readFile(path, 'utf8')),
);
if (allBuiltText.some((text) => /fonts\.(googleapis|gstatic)\.com/i.test(text))) {
  fail('a built HTML/CSS/JS asset still references Google Fonts.');
}

console.log(`Verified ${publicPaths.length} precached public assets, ${emittedFonts.length} local fonts, an eager route graph, a clean Observation matcher, route semantics, modal focus behavior, and compact-workflow guards.`);
