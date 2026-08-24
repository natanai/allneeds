import { describe, expect, it } from 'vitest';

import { defaultTheme, themeCssValues } from './customizerSettings';
import { resolveThemePresetName, themePresets } from './themePresets';

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

  it('recognizes untouched default values while leaving legacy custom themes unnamed', () => {
    expect(resolveThemePresetName({ values: { ...defaultTheme }, roundness: 100, preset: '' })).toBe('Default');
    expect(resolveThemePresetName({
      values: { ...defaultTheme, rose: '#FFFFFF' },
      roundness: 100,
      preset: 'Old palette',
    })).toBe('');
  });

  it('makes Refrigerator square-edged with warm white magnets on a retro seafoam palette', () => {
    const preset = themePresets.find(({ name }) => name === 'Refrigerator');
    expect(preset).toMatchObject({
      roundness: 0,
      values: {
        plum: '#6F9E91',
        lavender: '#F4F1E7',
        rose: '#D96C63',
        mint: '#B8DCCF',
        gold: '#F2D38A',
        sky: '#DDEFE9',
        outline: '#17201D',
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
