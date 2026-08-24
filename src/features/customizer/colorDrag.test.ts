import { describe, expect, it } from 'vitest';

import { colorFromDrag, hexToHsl, hslToHex, normalizeHex } from './colorDrag';

describe('legacy color-swatch drag math', () => {
  it('round-trips canonical hex colors through HSL', () => {
    const hsl = hexToHsl('#B7A6E8');
    expect(hsl).not.toBeNull();
    expect(hslToHex(hsl!)).toBe('#B7A6E8');
    expect(normalizeHex('#b7a')).toBe('#BB77AA');
  });

  it('uses horizontal motion for hue and vertical motion for lightness', () => {
    const start = hexToHsl('#B7A6E8')!;
    expect(colorFromDrag(start, 40, -30)).toBe('#E1CAF1');
  });

  it('uses vertical motion for saturation while Shift is held', () => {
    const start = hexToHsl('#B7A6E8')!;
    expect(colorFromDrag(start, 40, -30, true)).toBe('#CF9EF0');
  });

  it('rejects malformed values and clamps extreme drags', () => {
    expect(hexToHsl('not-a-color')).toBeNull();
    const start = hexToHsl('#B7A6E8')!;
    expect(colorFromDrag(start, 0, 1000)).toBe('#090514');
    expect(colorFromDrag(start, 0, -1000)).toBe('#EFEBFA');
  });
});
