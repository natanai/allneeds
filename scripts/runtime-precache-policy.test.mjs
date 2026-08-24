import { describe, expect, it } from 'vitest';

import {
  REQUIRED_RUNTIME_PRECACHE_PATHS,
  isRuntimePrecachePath,
  selectRuntimePrecachePaths,
} from './runtime-precache-policy.mjs';

describe('runtime precache policy', () => {
  it('keeps the installed app shell and every runtime data input', () => {
    REQUIRED_RUNTIME_PRECACHE_PATHS.forEach((path) => {
      expect(isRuntimePrecachePath(path), path).toBe(true);
    });
    expect(isRuntimePrecachePath('./assets/index-123.js')).toBe(true);
    expect(isRuntimePrecachePath('./icons/android-chrome-192x192.png')).toBe(true);
    expect(isRuntimePrecachePath('./site.webmanifest')).toBe(true);
  });

  it('does not first-install deployment-only or compatibility artifacts', () => {
    expect(isRuntimePrecachePath('./404.html')).toBe(false);
    expect(isRuntimePrecachePath('./docs/body-scan-sourcing-review.md')).toBe(false);
    expect(isRuntimePrecachePath('./lib/observationFormula.js')).toBe(false);
    expect(isRuntimePrecachePath('./data/observation_module_blueprints.json')).toBe(false);
    expect(isRuntimePrecachePath('./data/reverse-inference-overrides.json')).toBe(false);
  });

  it('preserves source order while filtering a deployment manifest', () => {
    expect(selectRuntimePrecachePaths([
      './index.html',
      './404.html',
      './assets/index-123.js',
      './lib/observationSuggest.js',
      './data/observation_cues.csv',
    ])).toEqual([
      './index.html',
      './assets/index-123.js',
      './data/observation_cues.csv',
    ]);
  });
});
