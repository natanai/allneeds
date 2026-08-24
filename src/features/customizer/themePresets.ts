import { defaultTheme, type ThemeValues } from './customizerSettings';

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
      plum: '#BFC5CC',
      lavender: '#F4F5F6',
      ink: '#171717',
      inkSoft: '#4A4A4A',
      rose: '#FFFFFF',
      mint: '#F7F7F5',
      gold: '#F2F2EE',
      sky: '#FAFAFA',
      outline: '#181818',
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
