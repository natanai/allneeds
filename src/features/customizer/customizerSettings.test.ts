import { describe, expect, it } from 'vitest';

import {
  defaultNavSettings,
  defaultTheme,
  NAV_SETTINGS_KEY,
  readNavSettings,
  readTheme,
  synchronizeCustomizerMirrors,
  THEME_KEY,
  themeCssValues,
} from './customizerSettings';

function memoryStorage(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe('saved customizer settings', () => {
  it('uses the newest valid local or session theme mirror', () => {
    const local = memoryStorage({
      [THEME_KEY]: JSON.stringify({ values: { plum: '#111111' }, roundness: 80, preset: 'Older', updatedAt: 10 }),
    });
    const session = memoryStorage({
      [THEME_KEY]: JSON.stringify({
        values: { plum: '#abc', rose: 'not-a-color' },
        roundness: 245,
        preset: 'Newest',
        updatedAt: 20,
      }),
    });

    expect(readTheme(local, session)).toEqual({
      values: { ...defaultTheme, plum: '#AABBCC' },
      roundness: 200,
      preset: 'Newest',
      updatedAt: 20,
    });
  });

  it('keeps local settings on equal timestamps and safely falls back on malformed data', () => {
    const local = memoryStorage({
      [THEME_KEY]: JSON.stringify({ values: { gold: '#123456' }, roundness: '50', updatedAt: 7 }),
    });
    const session = memoryStorage({ [THEME_KEY]: '{broken json' });

    expect(readTheme(local, session)).toMatchObject({
      values: { ...defaultTheme, gold: '#123456' },
      roundness: 50,
      updatedAt: 7,
    });
  });

  it('restores only boolean navigation choices from the newest mirror', () => {
    const local = memoryStorage({
      [NAV_SETTINGS_KEY]: JSON.stringify({ enabled: { feelings: false }, updatedAt: 1 }),
    });
    const session = memoryStorage({
      [NAV_SETTINGS_KEY]: JSON.stringify({ enabled: { feelings: true, needs: false, inventory: 'no' }, updatedAt: 2 }),
    });

    expect(readNavSettings(local, session)).toEqual({
      ...defaultNavSettings,
      feelings: true,
      needs: false,
    });
  });

  it('derives the complete runtime CSS contract and readable foreground colors', () => {
    const light = themeCssValues({ values: { ...defaultTheme, rose: '#FFFFFF' }, roundness: 130 });
    expect(light).toMatchObject({
      '--plum': defaultTheme.plum,
      '--rose': '#FFFFFF',
      '--btn-bg': '#FFFFFF',
      '--btn-fg': '#111111',
      '--chip-fg': '#111111',
      '--corner-scale': '1.3',
      '--shadow': `color-mix(in srgb, ${defaultTheme.outline} 55%, transparent)`,
    });

    const dark = themeCssValues({ values: { ...defaultTheme, rose: '#000000' }, roundness: -20 });
    expect(dark['--btn-fg']).toBe('#FFFFFF');
    expect(dark['--corner-scale']).toBe('0');
  });

  it('synchronizes the pre-paint session mirrors during backup restore', () => {
    const session = memoryStorage({
      [THEME_KEY]: 'stale-theme',
      [NAV_SETTINGS_KEY]: 'stale-navigation',
    });
    const restoredTheme = JSON.stringify({ values: { plum: '#ABCDEF' }, updatedAt: 40 });
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
