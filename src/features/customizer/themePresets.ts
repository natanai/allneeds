import { defaultTheme, type ThemeState, type ThemeValues } from './customizerSettings';

export type ThemePreset = Readonly<{
  name: string;
  values: ThemeValues;
  roundness: number;
}>;

export const themePresets: readonly ThemePreset[] = [
  {
    name: 'Default',
    values: { ...defaultTheme },
    roundness: 100,
  },
  {
    name: 'Refrigerator',
    values: {
      plum: '#6F9E91',
      lavender: '#F4F1E7',
      ink: '#171B19',
      inkSoft: '#45524D',
      rose: '#D96C63',
      mint: '#B8DCCF',
      gold: '#F2D38A',
      sky: '#DDEFE9',
      outline: '#17201D',
    },
    roundness: 0,
  },
  {
    name: 'Pixel Art',
    values: {
      plum: '#2B1B46',
      lavender: '#F6E6FF',
      ink: '#1B102B',
      inkSoft: '#4A2B63',
      rose: '#FF5DA2',
      mint: '#55E6C1',
      gold: '#FFD166',
      sky: '#63C5FF',
      outline: '#0B0711',
    },
    roundness: 0,
  },
  {
    name: 'Matrix',
    values: {
      plum: '#0B3D1F',
      lavender: '#D8FFD8',
      ink: '#061A0B',
      inkSoft: '#164D24',
      rose: '#39FF14',
      mint: '#7CFF6B',
      gold: '#C6FF00',
      sky: '#A8FFCF',
      outline: '#031007',
    },
    roundness: 0,
  },
  {
    name: 'Blueprint',
    values: {
      plum: '#0B4F8A',
      lavender: '#EAF5FF',
      ink: '#08243B',
      inkSoft: '#24516F',
      rose: '#FF7A90',
      mint: '#79E5D0',
      gold: '#FFE58A',
      sky: '#8ED8FF',
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
