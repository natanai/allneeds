import { describe, expect, it } from 'vitest';

import { shouldDismissSheet } from './sheetGesture';

describe('sheet header dismissal', () => {
  it('accepts a deliberate downward drag or short downward flick', () => {
    expect(shouldDismissSheet(80, 12, .1)).toBe(true);
    expect(shouldDismissSheet(30, -10, .8)).toBe(true);
  });

  it('rejects taps, short slow drags, upward drags, and sideways gestures', () => {
    expect(shouldDismissSheet(8, 0, 2)).toBe(false);
    expect(shouldDismissSheet(30, 0, .1)).toBe(false);
    expect(shouldDismissSheet(-100, 0, 2)).toBe(false);
    expect(shouldDismissSheet(90, 120, 2)).toBe(false);
    expect(shouldDismissSheet(0, 0, 0)).toBe(false);
  });
});
