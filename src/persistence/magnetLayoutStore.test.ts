import { describe, expect, it } from 'vitest';

import {
  magnetStorageName,
  readMagnetPlayPreference,
  readMagnetViewportLayout,
  writeMagnetViewportLayout,
} from './magnetLayoutStore';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe('magnet layout store', () => {
  it('keeps independent compact and wide arrangements', () => {
    const storage = memoryStorage();
    writeMagnetViewportLayout('feelings', {
      boardWidth: 390,
      boardHeight: 500,
      magnets: { calm: { x: 20, y: 30, xPct: 0.0513, yPct: 0.06 } },
      order: ['calm', 'hopeful'],
    }, true, storage);
    writeMagnetViewportLayout('feelings', {
      boardWidth: 900,
      boardHeight: 300,
      magnets: { calm: { x: 220, y: 80, xPct: 0.2444, yPct: 0.2667 } },
      order: ['hopeful', 'calm'],
    }, true, storage);

    expect(readMagnetViewportLayout('feelings', 390, storage)?.magnets.calm?.x).toBe(20);
    expect(readMagnetViewportLayout('feelings', 900, storage)?.magnets.calm?.x).toBe(220);
    expect(readMagnetViewportLayout('feelings', 390, storage)?.order).toEqual(['calm', 'hopeful']);
    expect(readMagnetViewportLayout('feelings', 900, storage)?.order).toEqual(['hopeful', 'calm']);
    expect(readMagnetPlayPreference('feelings', false, storage)).toBe(true);
  });

  it('reads the previous normalized layout once during migration', () => {
    const storage = memoryStorage({
      [magnetStorageName('needs')]: JSON.stringify({
        layoutVersion: 6,
        boardWidth: 800,
        boardHeight: 400,
        magnets: { safety: { xPct: 0.25, yPct: 0.5 } },
        meta: { playActive: true },
      }),
    });

    expect(readMagnetViewportLayout('needs', 800, storage)?.magnets.safety).toMatchObject({
      x: 200,
      y: 200,
    });
    expect(readMagnetPlayPreference('needs', false, storage)).toBe(true);
  });

  it('falls back safely when persisted data is malformed', () => {
    const storage = memoryStorage({ [magnetStorageName('broken')]: '{nope' });
    expect(readMagnetViewportLayout('broken', 900, storage)).toBeNull();
    expect(readMagnetPlayPreference('broken', false, storage)).toBe(false);
  });
});
