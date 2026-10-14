import { describe, expect, it } from 'vitest';

import { defaultTheme, themeCssValues } from './customizerSettings';
import { resolveThemePresetName, themePresets } from './themePresets';

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(left: string, right: string) {
  const [light, dark] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (light! + 0.05) / (dark! + 0.05);
}

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

  it('recognizes untouched default values while leaving older custom themes unnamed', () => {
    expect(resolveThemePresetName({ values: { ...defaultTheme }, roundness: 100, preset: '' })).toBe('Default');
    expect(resolveThemePresetName({
      values: { ...defaultTheme, action: '#FFFFFF' },
      roundness: 100,
      preset: 'Old palette',
    })).toBe('');
  });

  it('pairs black enamel with square paper labels and readable printed text', () => {
    const preset = themePresets.find(({ name }) => name === 'Refrigerator');
    const paperWhite = '#F3F0E7';
    expect(preset).toMatchObject({
      roundness: 0,
      appearance: 'refrigerator',
      values: {
        primary: '#20211F',
        quiet: paperWhite,
        action: paperWhite,
        positive: paperWhite,
        attention: paperWhite,
        selection: paperWhite,
        outline: '#171715',
      },
    });
    expect(new Set([
      preset?.values.quiet,
      preset?.values.action,
      preset?.values.positive,
      preset?.values.attention,
      preset?.values.selection,
    ])).toEqual(new Set([paperWhite]));
    expect(contrast(paperWhite, preset!.values.text)).toBeGreaterThanOrEqual(12);
    expect(contrast(paperWhite, preset!.values.secondary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(preset!.values.primary, themeCssValues(preset!)['--primary-fg']!)).toBeGreaterThanOrEqual(4.5);
  });

  it('gives every preset a distinct complete runtime theme without expanding the editable role set', () => {
    expect(new Set(themePresets.map((preset) => JSON.stringify([preset.roundness, preset.values]))).size)
      .toBe(themePresets.length);

    themePresets.forEach((preset) => {
      expect(Object.keys(preset.values).sort()).toEqual(Object.keys(defaultTheme).sort());
      expect(Object.keys(preset.values)).toHaveLength(9);
      expect(preset.roundness).toBeGreaterThanOrEqual(0);
      expect(preset.roundness).toBeLessThanOrEqual(200);
      const css = themeCssValues(preset);
      expect(css['--surface-raised']).toBe(preset.appearance === 'refrigerator'
        ? preset.values.quiet
        : `color-mix(in srgb, ${preset.values.quiet} 12%, #FFFFFF 88%)`);
      expect(css['--btn-bg']).toBe(preset.values.action);
      expect(css['--corner-scale']).toBe(String(preset.roundness / 100));
      expect(css['--btn-fg']).toMatch(/^#[0-9A-F]{6}$/);
      expect(contrast(preset.values.primary, css['--primary-fg']!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(css['--btn-bg']!, css['--btn-fg']!)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
