import { describe, expect, it } from 'vitest';
import { gestureHistory, MAX_VISIBLE_MS, MIN_VISIBLE_MS, panHistory, visibleWindow, zoomHistory } from './historyViewport';

const day = 86400000;
const range = visibleWindow(Date.parse('2026-10-01T00:00:00Z'), Date.parse('2026-10-31T00:00:00Z'));
describe('continuous history viewport', () => {
  it('zooms around a fixed focal moment rather than the middle of the screen', () => {
    const zoomed = zoomHistory(range, .5, .75);
    expect(zoomed.end - zoomed.start).toBe((range.end - range.start) / 2);
    expect(zoomed.start + (zoomed.end - zoomed.start) * .75).toBe(range.start + (range.end - range.start) * .75);
  });
  it('pans proportionally without modifying the duration or rounding to midnight', () => {
    const moved = panHistory(range, -.25);
    expect(moved.end - moved.start).toBe(range.end - range.start);
    expect(moved.start).toBe(range.start - 7.5 * day);
  });
  it('pins the point under a stationary pinch and combines a simultaneous horizontal move', () => {
    const pinch = gestureHistory(range, 200, 200, 100, 200, 400);
    expect(pinch.end - pinch.start).toBe(15 * day);
    expect(pinch.start + 7.5 * day).toBe(range.start + 15 * day);
    const shifted = gestureHistory(range, 200, 240, 100, 200, 400);
    expect(shifted.start).toBe(pinch.start - 1.5 * day);
  });
  it('keeps zoom bounded and preserves local calendar-day counting at small spans', () => {
    expect(zoomHistory(range, 0).end - zoomHistory(range, 0).start).toBe(MIN_VISIBLE_MS);
    expect(zoomHistory(range, 1e9).end - zoomHistory(range, 1e9).start).toBe(MAX_VISIBLE_MS);
    const small = visibleWindow(Date.parse('2026-10-13T23:00:00Z'), Date.parse('2026-10-14T02:00:00Z'));
    expect(small.days).toBe(2); // An hourly viewport may straddle local midnight.
  });
});
