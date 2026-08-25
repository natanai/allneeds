import { defaultTheme, type ThemeState, type ThemeValues } from './customizerSettings';

export type ThemePreset = Readonly<{
  name: string;
  values: ThemeValues;
  roundness: number;
}>;

const paperWhite = '#FFFEF8';

export const themePresets: readonly ThemePreset[] = [
  {
    name: 'Default',
    values: { ...defaultTheme },
    roundness: 100,
  },
  {
    name: 'Refrigerator',
    values: {
      primary: '#6F9E91',
      quiet: paperWhite,
      text: '#171B19',
      secondary: '#45524D',
      action: paperWhite,
      positive: paperWhite,
      attention: paperWhite,
      selection: paperWhite,
      outline: '#17201D',
    },
    roundness: 0,
  },
  {
    name: 'Pixel Art',
    values: {
      primary: '#2B1B46',
      quiet: '#F6E6FF',
      text: '#1B102B',
      secondary: '#4A2B63',
      action: '#FF5DA2',
      positive: '#55E6C1',
      attention: '#FFD166',
      selection: '#63C5FF',
      outline: '#0B0711',
    },
    roundness: 0,
  },
  {
    name: 'Matrix',
    values: {
      primary: '#0B3D1F',
      quiet: '#D8FFD8',
      text: '#061A0B',
      secondary: '#164D24',
      action: '#39FF14',
      positive: '#7CFF6B',
      attention: '#C6FF00',
      selection: '#A8FFCF',
      outline: '#031007',
    },
    roundness: 0,
  },
  {
    name: 'Blueprint',
    values: {
      primary: '#0B4F8A',
      quiet: '#EAF5FF',
      text: '#08243B',
      secondary: '#24516F',
      action: '#FF7A90',
      positive: '#79E5D0',
      attention: '#FFE58A',
      selection: '#8ED8FF',
      outline: '#061C2E',
    },
    roundness: 25,
  },
];

const themeKeys = Object.keys(defaultTheme) as Array<keyof ThemeValues>;

export function resolveThemePresetName(theme: Pick<ThemeState, 'values' | 'roundness' | 'preset'>) {
  const named = themePresets.find(({ name }) => name === theme.preset);
  if (named) return named.name;

  const exact = themePresets.find((candidate) =>
    candidate.roundness === theme.roundness
      && themeKeys.every((key) => candidate.values[key].toUpperCase() === theme.values[key].toUpperCase()),
  );
  return exact?.name ?? '';
}
