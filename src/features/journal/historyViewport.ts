import { calendarDay, type DateWindow } from './historyModel';

export const MIN_VISIBLE_MS = 60 * 60 * 1000; // Individual moments can be inspected down to an hour.
export const MAX_VISIBLE_MS = 20 * 366 * 86400000;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Use the actual elapsed span for gestures; calendar-day counts are for recaps, not gesture math. */
export function visibleWindow(start: number, end: number): DateWindow {
  const safeStart = Number.isFinite(start) ? start : Date.now() - 86400000;
  const safeEnd = Number.isFinite(end) && end > safeStart ? end : safeStart + MIN_VISIBLE_MS;
  return { start: safeStart, end: safeEnd, days: Math.max(1, calendarDay(safeEnd - 1) - calendarDay(safeStart) + 1) };
}
export function panHistory(range: DateWindow, fraction: number): DateWindow {
  const offset = (range.end - range.start) * fraction;
  return visibleWindow(range.start + offset, range.end + offset);
}
export function zoomHistory(range: DateWindow, factor: number, anchor = .5): DateWindow {
  const oldSpan = range.end - range.start;
  const span = clamp(oldSpan * factor, MIN_VISIBLE_MS, MAX_VISIBLE_MS);
  const position = clamp(anchor, 0, 1);
  const start = range.start + oldSpan * position - span * position;
  return visibleWindow(start, start + span);
}
/** A pinch can be diagonal or vertical, not just horizontal. */
export function fingerSeparation(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Pinch and pan in one calculation so the instant under the fingers stays in place. */
export function gestureHistory(range: DateWindow, startCenter: number, currentCenter: number, startDistance: number, currentDistance: number, plotWidth: number): DateWindow {
  if (!(plotWidth > 0)) return range;
  const anchor = clamp(startCenter / plotWidth, 0, 1);
  const scaled = zoomHistory(range, startDistance > 0 && currentDistance > 0 ? startDistance / currentDistance : 1, anchor);
  return panHistory(scaled, -(currentCenter - startCenter) / plotWidth);
}
