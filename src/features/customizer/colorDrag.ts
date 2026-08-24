export type HslColor = { h: number; s: number; l: number };

export function normalizeHex(hex: string) {
  const value = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return `#${[...value].map((character) => `${character}${character}`).join('')}`.toUpperCase();
  }
  if (/^[0-9a-f]{6}$/i.test(value)) return `#${value}`.toUpperCase();
  return null;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizeHue(value: number) {
  if (!Number.isFinite(value)) return 0;
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function hexToHsl(hex: string): HslColor | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = normalized.slice(1);

  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const difference = max - min;
    saturation = lightness > 0.5
      ? difference / (2 - max - min)
      : difference / (max + min);
    if (max === red) hue = (green - blue) / difference + (green < blue ? 6 : 0);
    else if (max === green) hue = (blue - red) / difference + 2;
    else hue = (red - green) / difference + 4;
    hue /= 6;
  }

  return { h: hue * 360, s: saturation * 100, l: lightness * 100 };
}

function hueToRgb(p: number, q: number, hue: number) {
  let value = hue;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

export function hslToHex(hsl: HslColor) {
  const hue = normalizeHue(hsl.h) / 360;
  const saturation = clampNumber(hsl.s, 0, 100) / 100;
  const lightness = clampNumber(hsl.l, 0, 100) / 100;
  let red: number;
  let green: number;
  let blue: number;

  if (saturation === 0) {
    red = lightness;
    green = lightness;
    blue = lightness;
  } else {
    const q = lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    red = hueToRgb(p, q, hue + 1 / 3);
    green = hueToRgb(p, q, hue);
    blue = hueToRgb(p, q, hue - 1 / 3);
  }

  const component = (number: number) => Math.round(clampNumber(number * 255, 0, 255))
    .toString(16)
    .padStart(2, '0');
  return `#${component(red)}${component(green)}${component(blue)}`.toUpperCase();
}

export function colorFromDrag(start: HslColor, deltaX: number, deltaY: number, shiftKey = false) {
  const next = { ...start, h: normalizeHue(start.h + deltaX * 0.5) };
  if (shiftKey) next.s = clampNumber(start.s - deltaY * 0.5, 0, 100);
  else next.l = clampNumber(start.l - deltaY * 0.3, 5, 95);
  return hslToHex(next);
}
