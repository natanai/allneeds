import { describe, expect, it } from 'vitest';

import {
  getAabbCollision,
  getMagnetTilt,
  limitVector,
  mergeVisibleMagnetOrder,
  NAV_REST_PACKING,
  orderMagnetsByVisualRows,
  packMagnets,
  placementsOverlap,
  stableHash,
} from './magnetMath';

describe('magnet math', () => {
  it('keeps a magnet identity deterministic across renders', () => {
    expect(stableHash('calm')).toBe(stableHash('calm'));
    expect(getMagnetTilt('calm')).toBe(getMagnetTilt('calm'));
  });

  it('keeps decorative tilt subtle', () => {
    for (const id of ['calm', 'sad', 'hopeful', 'bewildered', 'excited']) {
      expect(Math.abs(getMagnetTilt(id))).toBeLessThanOrEqual(2);
    }
  });

  it('packs magnets into non-overlapping rows and grows the board', () => {
    const result = packMagnets(
      [
        { id: 'one', width: 100, height: 44 },
        { id: 'two', width: 120, height: 44 },
        { id: 'three', width: 100, height: 52 },
      ],
      { boardWidth: 280, padding: 16, gapX: 12, gapY: 14 },
    );

    expect(result.height).toBeGreaterThan(100);
    for (let index = 0; index < result.placements.length; index += 1) {
      for (let other = index + 1; other < result.placements.length; other += 1) {
        expect(placementsOverlap(result.placements[index]!, result.placements[other]!)).toBe(false);
      }
    }
  });

  it('reserves the top-right corner for a shared board control', () => {
    const result = packMagnets(
      [
        { id: 'one', width: 100, height: 44 },
        { id: 'two', width: 100, height: 44 },
        { id: 'three', width: 100, height: 44 },
      ],
      { boardWidth: 360, padding: 16, gapX: 12, gapY: 14, firstRowRightInset: 48 },
    );

    expect(result.placements[2]?.y).toBeGreaterThan(16);
    expect(result.placements[2]?.x).toBe(16);
  });

  it('keeps the standard seven-magnet desktop navigation on one compact row', () => {
    const result = packMagnets([
      { id: 'home', width: 44, height: 44 },
      { id: 'customizer', width: 44, height: 44 },
      { id: 'journal', width: 150, height: 44 },
      { id: 'inventory', width: 175, height: 44 },
      { id: 'observations', width: 180, height: 44 },
      { id: 'feelings', width: 130, height: 44 },
      { id: 'needs', width: 100, height: 44 },
    ], { boardWidth: 960, ...NAV_REST_PACKING });

    expect(new Set(result.placements.map((placement) => placement.y))).toEqual(new Set([10]));
    expect(result.height).toBe(64);
  });

  it('reads a loose nav arrangement as stable top-to-bottom, left-to-right order', () => {
    const ordered = orderMagnetsByVisualRows([
      { id: 'right', x: 120, y: 5, width: 90, height: 44 },
      { id: 'next-row', x: 0, y: 64, width: 90, height: 44 },
      { id: 'left', x: 8, y: 9, width: 90, height: 44 },
    ]);

    expect(ordered.map((magnet) => magnet.id)).toEqual(['left', 'right', 'next-row']);
  });

  it('keeps a newly arranged nav order while retaining temporarily hidden items', () => {
    expect(mergeVisibleMagnetOrder(
      ['home', 'journal', 'inventory', 'feelings', 'needs'],
      ['needs', 'home', 'feelings', 'inventory'],
    )).toEqual(['needs', 'journal', 'home', 'feelings', 'inventory']);
  });

  it('rest-packs a dragged nav arrangement without changing the user order', () => {
    const dragged = orderMagnetsByVisualRows([
      { id: 'home', x: 96, y: 10, width: 56, height: 44 },
      { id: 'menu', x: 220, y: 18, width: 56, height: 44 },
      { id: 'needs', x: 4, y: 2, width: 82, height: 44 },
      { id: 'observations', x: 8, y: 70, width: 148, height: 44 },
      { id: 'feelings', x: 176, y: 72, width: 104, height: 44 },
    ]);
    const userOrder = dragged.map((magnet) => magnet.id);
    const packed = packMagnets(
      userOrder.map((id) => {
        const magnet = dragged.find((candidate) => candidate.id === id)!;
        return { id, width: magnet.width, height: magnet.height };
      }),
      { boardWidth: 340, ...NAV_REST_PACKING },
    );

    expect(userOrder).toEqual(['needs', 'home', 'menu', 'observations', 'feelings']);
    expect(packed.placements.map((magnet) => magnet.id)).toEqual(userOrder);
    expect(packed.height).toBeLessThan(130);
  });

  it('deduplicates saved nav order and appends newly introduced magnets', () => {
    expect(mergeVisibleMagnetOrder(
      ['home', 'home', 'journal'],
      ['journal', 'home', 'observations'],
    )).toEqual(['journal', 'home', 'observations']);
  });

  it('caps a fling without changing its direction', () => {
    const limited = limitVector(1200, 1600, 1000);
    expect(limited.x).toBeCloseTo(600);
    expect(limited.y).toBeCloseTo(800);
  });

  it('finds the shallowest collision axis for a stable response', () => {
    expect(getAabbCollision(
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 90, y: 5, width: 100, height: 50 },
    )).toEqual({ normalX: 1, normalY: 0, depth: 10 });
    expect(getAabbCollision(
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 10, y: 45, width: 100, height: 50 },
    )).toEqual({ normalX: 0, normalY: 1, depth: 5 });
  });
});
