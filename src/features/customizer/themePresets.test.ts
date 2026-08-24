import { describe, expect, it } from 'vitest';

import { defaultTheme, themeCssValues } from './customizerSettings';
import { themePresets } from './themePresets';

describe('customizer theme presets', () => {
  it('keeps a focused set of five meaningful presets', () => {
    expect(themePresets.map((preset) => preset.name)).toEqual([
      'Default',
      'Refrigerator',
      'Pixel Art',
      'Matrix',
      'Blueprint',
    ]);
  });

  it('keeps Default identical to the production palette', () => {
    const preset = themePresets.find(({ name }) => name === 'Default');
    expect(preset).toMatchObject({ values: defaultTheme, roundness: 100 });
  });

  it('makes Refrigerator square-edged with a near-white magnet palette', () => {
    const preset = themePresets.find(({ name }) => name === 'Refrigerator');
    expect(preset).toMatchObject({
      roundness: 0,
      values: {
        rose: '#FFFFFF',
        mint: '#F7F7F5',
        gold: '#F2F2EE',
        sky: '#FAFAFA',
        outline: '#181818',
      },
    });
  });

  it('gives every preset a distinct valid runtime theme', () => {
    expect(new Set(themePresets.map((preset) => JSON.stringify([preset.roundness, preset.values]))).size)
      .toBe(themePresets.length);

    themePresets.forEach((preset) => {
      expect(preset.roundness).toBeGreaterThanOrEqual(0);
      expect(preset.roundness).toBeLessThanOrEqual(200);
      const css = themeCssValues(preset);
      expect(css['--corner-scale']).toBe(String(preset.roundness / 100));
      expect(css['--btn-fg']).toMatch(/^#[0-9A-F]{6}$/);
    });
  });
});
