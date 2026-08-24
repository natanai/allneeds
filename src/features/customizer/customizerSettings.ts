import { normalizeHex } from './colorDrag';

export const THEME_KEY = 'nvcApp.theme';
export const NAV_SETTINGS_KEY = 'nvcApp.navSettings';
export const NAV_SETTINGS_CHANGED_EVENT = 'allneeds:nav-settings-changed';
export const THEME_CHANGED_EVENT = 'allneeds:theme-changed';

export const defaultTheme = {
  plum: '#74569B', lavender: '#EDE4FF', surface: '#FFFFFF', ink: '#1F1230', inkSoft: '#392351',
  rose: '#FFB3CB', mint: '#96FBC7', gold: '#F7FFAE', peach: '#FFDFC9', sky: '#D3F1FF', outline: '#12081F',
} as const;

export type ThemeValues = Record<keyof typeof defaultTheme, string>;
export type ThemeState = {
  values: ThemeValues;
  roundness: number;
  preset: string;
  updatedAt: number;
};
export type NavItemId = 'journal' | 'inventory' | 'observations' | 'fauxFeelings' | 'feelings' | 'needs' | 'bodyCues' | 'journalDashboard';
export type NavSettings = Record<NavItemId, boolean>;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const themeVariables: Record<keyof ThemeValues, string> = {
  plum: '--plum', lavender: '--lavender', surface: '--surface-raised', ink: '--ink', inkSoft: '--ink-soft',
  rose: '--rose', mint: '--mint', gold: '--gold', peach: '--peach', sky: '--sky', outline: '--outline',
};

export const defaultNavSettings: NavSettings = {
  journal: false, inventory: true, observations: true, fauxFeelings: false,
  feelings: true, needs: true, bodyCues: false, journalDashboard: false,
};

const paletteRows = [
  ['Holographic','#1c1529','#5f65b5','#9779d1','#84b5e5','#e19bd9','#a1d5b4','#efcaa7','#e7e0e4','#161020'],
  ['Dreamscape','#543344','#8b4049','#515262','#63787d','#ae6a47','#8ea091','#caa05a','#c9cca1','#432836'],
  ['Game Kid','#5A6D7C','#E6F6C5','#1E1F2A','#3C3F4D','#FFA5C5','#8FE1B5','#F7E88C','#B6D7CE','#101725'],
  ['Pastel Portal','#7D5DA6','#F3E9FF','#231336','#433055','#FFB5C7','#9DE5CB','#F8F2AA','#C8E8FF','#1A0D29'],
  ['Ice Cream GB','#7c3f58','#a65061','#cf6069','#ed7370','#f28a72','#f7a074','#fbbc8d','#fdd9b0','#fff6d3'],
  ['AYY4','#00303b','#604b52','#bf6568','#ff827b','#ffa387','#ffc392','#fcd7a7','#f6e5c1','#f1f2da'],
  ['2bit Demichrome','#211e20','#35333b','#484756','#5e5e6c','#7b7b7a','#979787','#b2b4a3','#ced1c8','#e9efec'],
  ['Hollow','#0f0f1b','#2a2b3d','#44475f','#64667e','#8e899a','#b8abb5','#d3c8cc','#e7e2e1','#fafbf6'],
  ['Lospec GB','#000000','#150f19','#2a1e32','#41314b','#5a4b62','#746478','#8f8392','#aba5ac','#c7c6c6'],
  ['Colorboy','#322f3d','#584152','#7f5467','#a36d74','#c39572','#e3bd70','#efd78d','#f1ebbb','#f2ffe8'],
  ['BLK AQU4','#002b59','#003f6c','#00527f','#006a92','#008ca5','#00aeb8','#28c8c8','#63ded6','#9ff4e5'],
  ['Blood Crow','#190000','#300303','#470707','#610c0c','#821515','#a21d1d','#be5252','#d89c9c','#f2e6e6'],
  ['Italy-4','#100f24','#55242a','#993830','#ba4f3a','#926a4a','#6a845b','#81a47f','#b7c7ac','#edeada'],
  ['Mokky','#332920','#463526','#59412c','#6c4d32','#805937','#93643b','#a67849','#b98f5c','#cca66e'],
  ['Dream Haze 8','#3c42c4','#6e51c8','#a065cd','#ce79d2','#d68fb8','#dda2a3','#eac4ae','#f4dfbe','#30349c'],
  ['Gothic Bit','#0e0e12','#1a1a24','#333346','#535373','#8080a4','#a6a6bf','#c1c1d2','#e6e6ec','#0b0b0e'],
  ['PurpleMorning8','#211d38','#2e2a4f','#3b405e','#60556e','#9a6278','#c7786f','#cfa98a','#cdd4a5','#1a172c'],
  ['SweetHope','#615e85','#717fb0','#9c8dc2','#90b4de','#d9a3cd','#a3d1af','#ebc3a7','#e0e0dc','#4d4b6a'],
  ["DawnBringer's 8 color",'#000000','#55415f','#646964','#508cd7','#d77355','#64b964','#e6c86e','#dcf5ff','#000000'],
  ['Argeebey 8','#000000','#1f246a','#8a1181','#d14444','#2ca53e','#68cbcb','#e3c72d','#ffffff','#000000'],
] as const;

export const palettes: Array<{ name: string; values: ThemeValues }> = paletteRows.map(([name, plum, lavender, ink, inkSoft, rose, mint, gold, sky, outline]) => ({
  name,
  values: {
    plum,
    lavender,
    surface: defaultTheme.surface,
    ink,
    inkSoft,
    rose,
    mint,
    gold,
    peach: defaultTheme.peach,
    sky,
    outline,
  },
}));

function availableStorage(name: 'localStorage' | 'sessionStorage'): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try { return window[name]; } catch { return null; }
}

function clampRoundness(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? Math.min(200, Math.max(0, Math.round(number))) : 100;
}

function updatedAt(value: unknown) {
  if (!value || typeof value !== 'object') return 0;
  const number = (value as { updatedAt?: unknown }).updatedAt;
  return typeof number === 'number' && Number.isFinite(number) ? number : 0;
}

function parseStored(storage: StorageLike | null, key: string) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function newestStored(local: StorageLike | null, session: StorageLike | null, key: string) {
  const localValue = parseStored(local, key);
  const sessionValue = parseStored(session, key);
  if (!localValue) return sessionValue;
  if (!sessionValue) return localValue;
  return updatedAt(sessionValue) > updatedAt(localValue) ? sessionValue : localValue;
}

export function readTheme(
  local: StorageLike | null = availableStorage('localStorage'),
  session: StorageLike | null = availableStorage('sessionStorage'),
): ThemeState {
  const parsed = newestStored(local, session, THEME_KEY) as {
    values?: unknown; roundness?: unknown; preset?: unknown; updatedAt?: unknown;
  } | null;
  const rawValues = parsed?.values && typeof parsed.values === 'object' && !Array.isArray(parsed.values)
    ? parsed.values as Partial<Record<keyof ThemeValues, unknown>>
    : {};
  const values = { ...defaultTheme } as ThemeValues;
  (Object.keys(defaultTheme) as Array<keyof ThemeValues>).forEach((key) => {
    const normalized = typeof rawValues[key] === 'string' ? normalizeHex(rawValues[key]) : null;
    if (normalized) values[key] = normalized;
  });
  return {
    values,
    roundness: clampRoundness(parsed?.roundness),
    preset: typeof parsed?.preset === 'string' ? parsed.preset : '',
    updatedAt: updatedAt(parsed),
  };
}

function relativeLuminance(hex: string) {
  const normalized = normalizeHex(hex) ?? '#000000';
  const channels = [1, 3, 5].map((start) => Number.parseInt(normalized.slice(start, start + 2), 16) / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function themeCssValues(theme: Pick<ThemeState, 'values' | 'roundness'>) {
  const css: Record<string, string> = {};
  (Object.keys(themeVariables) as Array<keyof ThemeValues>).forEach((key) => {
    css[themeVariables[key]] = normalizeHex(theme.values[key]) ?? defaultTheme[key];
  });
  css['--corner-scale'] = String(clampRoundness(theme.roundness) / 100);
  css['--shadow'] = `color-mix(in srgb, ${css['--outline']} 55%, transparent)`;
  css['--btn-bg'] = css['--rose']!;
  css['--chip-bg'] = `color-mix(in srgb, ${css['--surface-raised']} 86%, ${css['--sky']} 14%)`;
  const backgroundLuminance = relativeLuminance(css['--btn-bg']!);
  const blackRatio = (backgroundLuminance + 0.05) / (relativeLuminance('#111111') + 0.05);
  const whiteRatio = (relativeLuminance('#FFFFFF') + 0.05) / (backgroundLuminance + 0.05);
  css['--btn-fg'] = blackRatio >= whiteRatio ? '#111111' : '#FFFFFF';
  css['--chip-fg'] = css['--btn-fg']!;
  return css;
}

export function applyThemeToRoot(
  theme: Pick<ThemeState, 'values' | 'roundness'>,
  root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement,
) {
  if (!root) return;
  const css = themeCssValues(theme);
  Object.entries(css).forEach(([property, value]) => root.style.setProperty(property, value));
  root.dataset.themePreapplied = 'true';
}

export function writeTheme(theme: Pick<ThemeState, 'values' | 'roundness' | 'preset'>) {
  const payload: ThemeState = {
    values: { ...defaultTheme },
    roundness: clampRoundness(theme.roundness),
    preset: theme.preset,
    updatedAt: Date.now(),
  };
  (Object.keys(defaultTheme) as Array<keyof ThemeValues>).forEach((key) => {
    payload.values[key] = normalizeHex(theme.values[key]) ?? defaultTheme[key];
  });
  const serialized = JSON.stringify(payload);
  [availableStorage('localStorage'), availableStorage('sessionStorage')].forEach((storage) => {
    try { storage?.setItem(THEME_KEY, serialized); } catch { /* The current page still receives the theme. */ }
  });
  applyThemeToRoot(payload);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: payload }));
  return payload;
}

export function readNavSettings(
  local: StorageLike | null = availableStorage('localStorage'),
  session: StorageLike | null = availableStorage('sessionStorage'),
): NavSettings {
  const parsed = newestStored(local, session, NAV_SETTINGS_KEY) as { enabled?: unknown } | null;
  const enabled = parsed?.enabled && typeof parsed.enabled === 'object' && !Array.isArray(parsed.enabled)
    ? parsed.enabled as Partial<NavSettings>
    : {};
  const settings = { ...defaultNavSettings };
  (Object.keys(defaultNavSettings) as NavItemId[]).forEach((key) => {
    if (typeof enabled[key] === 'boolean') settings[key] = enabled[key];
  });
  return settings;
}

export function writeNavSettings(enabled: NavSettings) {
  const serialized = JSON.stringify({ enabled: { home: true, customizer: true, ...enabled }, updatedAt: Date.now() });
  [availableStorage('localStorage'), availableStorage('sessionStorage')].forEach((storage) => {
    try { storage?.setItem(NAV_SETTINGS_KEY, serialized); } catch { /* The current page still receives the settings. */ }
  });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(NAV_SETTINGS_CHANGED_EVENT, { detail: enabled }));
}

export function synchronizeCustomizerMirrors(
  snapshot: Record<string, unknown>,
  session: StorageLike | null = availableStorage('sessionStorage'),
) {
  if (!session) return;
  [THEME_KEY, NAV_SETTINGS_KEY].forEach((key) => {
    try {
      const value = snapshot[key];
      if (typeof value === 'string') session.setItem(key, value);
      else if (value === undefined || value === null) session.removeItem(key);
      else session.setItem(key, JSON.stringify(value));
    } catch { /* Reload will still use the restored local snapshot where session storage is unavailable. */ }
  });
}
