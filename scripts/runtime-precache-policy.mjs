const requiredRuntimeData = new Set([
  './data/observation-guide.json',
  './data/observation_cue_modules.json',
  './data/observation_cues.csv',
]);

export const REQUIRED_RUNTIME_PRECACHE_PATHS = Object.freeze([
  './index.html',
  ...requiredRuntimeData,
]);

export function isRuntimePrecachePath(path) {
  if (path === './service-worker.js' || path === './404.html') return false;
  // Non-runtime research documents and compatibility paths never belong in the first-install cache.
  if (path.startsWith('./docs/') || path.startsWith('./lib/')) return false;
  if (path.startsWith('./data/')) return requiredRuntimeData.has(path);
  return true;
}

export function selectRuntimePrecachePaths(paths) {
  return paths.filter(isRuntimePrecachePath);
}
