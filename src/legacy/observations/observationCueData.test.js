import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';

import {
  compileObservationCueLibrary,
  parseObservationCueCSV,
  parseObservationCueModules,
  splitCuePatternColumn,
} from './observationCueData.js';

const fixtureRoot = new URL('../../../public/data/', import.meta.url);

describe('observation cue detector compilation', () => {
  it('preserves escaped regex alternation inside the generated CSV field', () => {
    expect(splitCuePatternColumn(String.raw`\\b(?:one\|two)\\b|plain`)).toEqual([
      String.raw`\b(?:one|two)\b`,
      'plain',
    ]);
  });

  it('compiles every shipped module detector without warnings or silent skips', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const [csvText, moduleText] = await Promise.all([
      readFile(new URL('observation_cues.csv', fixtureRoot), 'utf8'),
      readFile(new URL('observation_cue_modules.json', fixtureRoot), 'utf8'),
    ]);
    const cues = parseObservationCueCSV(csvText);
    const modules = parseObservationCueModules(moduleText);
    const detectorRegexes = modules.flatMap(module => module.detectors ?? [])
      .filter(detector => detector?.type === 'regex');

    expect(detectorRegexes.length).toBeGreaterThan(100);
    detectorRegexes.forEach(detector => {
      expect(() => new RegExp(detector.pattern, detector.flags ?? 'i')).not.toThrow();
    });

    const library = compileObservationCueLibrary({ cues, modules });
    expect(warn).not.toHaveBeenCalled();
    expect(library.modules.length).toBeGreaterThan(50);
    expect(library.modules.every(module => module.matchers.length > 0)).toBe(true);
    expect(cues.every(cue => cue.patterns.length > 0)).toBe(true);
    expect(cues.find(cue => cue.id === 'love-caring-comfort-turned-away')?.patterns
      .some(pattern => pattern.test('I reached to offer a hug and they stepped back.'))).toBe(true);
    expect(cues.find(cue => cue.id === 'support-skipped-meal')?.patterns
      .some(pattern => pattern.test('We skipped lunch to finish the work.'))).toBe(true);
    warn.mockRestore();
  });
});
