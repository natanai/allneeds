import { describe, expect, it } from 'vitest';

import {
  defaultNavSettings,
  defaultTheme,
  NAV_SETTINGS_KEY,
  palettes,
  readNavSettings,
  readTheme,
  synchronizeCustomizerMirrors,
  THEME_KEY,
  themeCssValues,
  themeRoleMetadata,
} from './customizerSettings';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe('saved customizer settings', () => {
  it('uses the newest valid local or session theme mirror', () => {
    const local = memoryStorage({
      [THEME_KEY]: JSON.stringify({ values: { primary: '#111111' }, roundness: 80, preset: 'Older', updatedAt: 10 }),
    });
    const session = memoryStorage({
      [THEME_KEY]: JSON.stringify({
        values: { primary: '#abc', action: 'not-a-color' },
        roundness: 245,
        preset: 'Newest',
        updatedAt: 20,
      }),
    });

    expect(readTheme(local, session)).toEqual({
      values: { ...defaultTheme, primary: '#AABBCC' },
      roundness: 200,
      preset: 'Newest',
      updatedAt: 20,
    });
  });

  it('keeps local settings on equal timestamps and safely falls back on malformed data', () => {
    const local = memoryStorage({
      [THEME_KEY]: JSON.stringify({ values: { attention: '#123456' }, roundness: '50', updatedAt: 7 }),
    });
    const session = memoryStorage({ [THEME_KEY]: '{broken json' });

    expect(readTheme(local, session)).toMatchObject({
      values: { ...defaultTheme, attention: '#123456' },
      roundness: 50,
      updatedAt: 7,
    });
  });

  it('migrates hue-keyed saved themes into the semantic role model', () => {
    const storage = memoryStorage({
      [THEME_KEY]: JSON.stringify({
        values: {
          plum: '#111111', lavender: '#222222', ink: '#333333', inkSoft: '#444444',
          rose: '#555555', mint: '#666666', gold: '#777777', sky: '#888888', outline: '#999999',
          surface: '#ABCDEF', peach: '#FEDCBA',
        },
        roundness: 100,
        updatedAt: 9,
      }),
    });

    expect(readTheme(storage, null).values).toEqual({
      primary: '#111111', quiet: '#222222', text: '#333333', secondary: '#444444',
      action: '#555555', positive: '#666666', attention: '#777777', selection: '#888888', outline: '#999999',
    });
  });

  it('prefers semantic values when modern and legacy fields coexist', () => {
    const storage = memoryStorage({
      [THEME_KEY]: JSON.stringify({ values: { primary: '#ABCDEF', plum: '#111111' }, updatedAt: 4 }),
    });
    expect(readTheme(storage, null).values.primary).toBe('#ABCDEF');
  });

  it('keeps all palette collections on the same compact nine-role semantic model', () => {
    const semanticKeys = Object.keys(themeRoleMetadata).sort();
    expect(semanticKeys).toEqual([
      'action', 'attention', 'outline', 'positive', 'primary', 'quiet', 'secondary', 'selection', 'text',
    ]);
    palettes.forEach(({ values }) => {
      expect(Object.keys(values).sort()).toEqual(semanticKeys);
      expect(Object.keys(values)).toHaveLength(9);
    });
  });

  it('keeps Home and Customizer on by default while restoring explicit opt-outs', () => {
    expect(defaultNavSettings.home).toBe(true);
    expect(defaultNavSettings.customizer).toBe(true);

    const local = memoryStorage({
      [NAV_SETTINGS_KEY]: JSON.stringify({ enabled: { feelings: false }, updatedAt: 1 }),
    });
    const session = memoryStorage({
      [NAV_SETTINGS_KEY]: JSON.stringify({
        enabled: { home: false, customizer: false, feelings: true, needs: false, inventory: 'no' },
        updatedAt: 2,
      }),
    });

    expect(readNavSettings(local, session)).toEqual({
      ...defaultNavSettings,
      home: false,
      customizer: false,
      feelings: true,
      needs: false,
    });
  });

  it('backfills Home and Customizer as enabled for older saved navigation settings', () => {
    const storage = memoryStorage({
      [NAV_SETTINGS_KEY]: JSON.stringify({ enabled: { inventory: false, feelings: false }, updatedAt: 5 }),
    });

    expect(readNavSettings(storage, null)).toMatchObject({
      home: true,
      customizer: true,
      inventory: false,
      feelings: false,
    });
  });

  it('derives shared runtime surfaces from semantic roles', () => {
    const light = themeCssValues({ values: { ...defaultTheme, action: '#FFFFFF' }, roundness: 130 });
    const surface = `color-mix(in srgb, ${defaultTheme.quiet} 12%, #FFFFFF 88%)`;
    expect(light).toMatchObject({
      '--primary': defaultTheme.primary,
      '--quiet': defaultTheme.quiet,
      '--text': defaultTheme.text,
      '--secondary': defaultTheme.secondary,
      '--action': '#FFFFFF',
      '--positive': defaultTheme.positive,
      '--attention': defaultTheme.attention,
      '--selection': defaultTheme.selection,
      '--surface-raised': surface,
      '--btn-bg': '#FFFFFF',
      '--btn-fg': '#111111',
      '--chip-fg': '#111111',
      '--chip-bg': `color-mix(in srgb, ${surface} 86%, ${defaultTheme.selection} 14%)`,
      '--corner-scale': '1.3',
      '--shadow': `color-mix(in srgb, ${defaultTheme.outline} 55%, transparent)`,
    });
    expect(Object.keys(light).some((key) => /plum|lavender|ink|rose|mint|gold|sky|peach/i.test(key))).toBe(false);

    const dark = themeCssValues({ values: { ...defaultTheme, action: '#000000' }, roundness: -20 });
    expect(dark['--btn-fg']).toBe('#FFFFFF');
    expect(dark['--corner-scale']).toBe('0');
  });

  it('synchronizes the pre-paint session mirrors during backup restore', () => {
    const session = memoryStorage({
      [THEME_KEY]: 'stale-theme',
      [NAV_SETTINGS_KEY]: 'stale-navigation',
    });
    const restoredTheme = JSON.stringify({ values: { primary: '#ABCDEF' }, updatedAt: 40 });
    synchronizeCustomizerMirrors({
      [THEME_KEY]: restoredTheme,
      [NAV_SETTINGS_KEY]: { enabled: { needs: false }, updatedAt: 41 },
    }, session);

    expect(session.getItem(THEME_KEY)).toBe(restoredTheme);
    expect(JSON.parse(session.getItem(NAV_SETTINGS_KEY)!)).toEqual({ enabled: { needs: false }, updatedAt: 41 });

    synchronizeCustomizerMirrors({}, session);
    expect(session.getItem(THEME_KEY)).toBeNull();
    expect(session.getItem(NAV_SETTINGS_KEY)).toBeNull();
  });
});
