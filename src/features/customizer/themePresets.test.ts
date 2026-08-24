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

  it('makes Refrigerator square-edged and reuses one paper white across magnet-face roles', () => {
    const preset = themePresets.find(({ name }) => name === 'Refrigerator');
    const paperWhite = '#FFFEF8';
    expect(preset).toMatchObject({
      roundness: 0,
      values: {
        plum: '#6F9E91',
        lavender: paperWhite,
        rose: paperWhite,
        mint: paperWhite,
        gold: paperWhite,
        sky: paperWhite,
        outline: '#17201D',
      },
    });
    expect(new Set([
      preset?.values.lavender,
      preset?.values.rose,
      preset?.values.mint,
      preset?.values.gold,
      preset?.values.sky,
    ])).toEqual(new Set([paperWhite]));
  });

  it('gives every preset a distinct complete runtime theme without expanding the editable palette', () => {
    expect(new Set(themePresets.map((preset) => JSON.stringify([preset.roundness, preset.values]))).size)
      .toBe(themePresets.length);

    themePresets.forEach((preset) => {
      expect(Object.keys(preset.values).sort()).toEqual(Object.keys(defaultTheme).sort());
      expect(Object.keys(preset.values)).toHaveLength(9);
      expect(preset.roundness).toBeGreaterThanOrEqual(0);
      expect(preset.roundness).toBeLessThanOrEqual(200);
      const css = themeCssValues(preset);
      expect(css['--surface-raised']).toBe(`color-mix(in srgb, ${preset.values.lavender} 12%, #FFFFFF 88%)`);
      expect(css['--peach']).toBe(preset.values.rose);
      expect(css['--corner-scale']).toBe(String(preset.roundness / 100));
      expect(css['--btn-fg']).toMatch(/^#[0-9A-F]{6}$/);
    });
  });
});
