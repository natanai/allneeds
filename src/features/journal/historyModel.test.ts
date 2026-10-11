import { describe, expect, it } from 'vitest';
import { addDays, buildHistorySeries, dateKey, defaultHistorySettings, filterHistory, historyCsv, historySummary, historyWindow, parseDay, previousWindow, shiftWindow, zoomWindow } from './historyModel';
import { createJournalRecord, type JournalRecord } from './journalRepository';

const entry = (id: string, day: string, mood?: number, feelings: JournalRecord['feelings'] = [], arousal?: number): JournalRecord => ({ ...createJournalRecord({ notes: id, feelings, ...(mood === undefined ? {} : { mood: { kind: 'rated', value: mood, ...(arousal === undefined ? {} : { arousal }) } }) }), id, dateISO: `${day}T12:00:00.000Z` });
const range = { start: Date.parse('2026-10-01T00:00:00Z'), end: Date.parse('2026-10-08T00:00:00Z'), days: 7 };
describe('emotional history semantics', () => {
  it('defaults to the two-coordinate view and never derives pleasantness from feelings', () => {
    expect(defaultHistorySettings([entry('a', '2026-10-01', undefined, [{ feeling: 'Sad', intensity: 7 }])]).metric).toBe('mood');
    expect(defaultHistorySettings([entry('b', '2026-10-01', -2)]).metric).toBe('mood');
    expect(defaultHistorySettings([]).metric).toBe('mood');
  });
  it('keeps neutral scores and connects recorded points across unscored or missing days', () => {
    const records = [entry('a', '2026-10-01', 0), { ...entry('b', '2026-10-02'), mood: { kind: 'mixed' as const } }, entry('c', '2026-10-03', -2), entry('d', '2026-10-05', 4)];
    const settings = defaultHistorySettings(records);
    const series = buildHistorySeries(records, settings, range)[0]!;
    expect(series.points.map((point) => point.value)).toEqual([0, -2, 4]);
    expect(series.segments.map((segment) => segment.length)).toEqual([3]);
    expect(historySummary(records, settings, range)).toMatchObject({ entries: 4, rated: 3, median: 0, mixed: 1, loggedDays: 4 });
  });
  it('plots valence and arousal independently and leaves legacy arousal missing', () => {
    const records = [entry('both', '2026-10-01', 2, [], -4), entry('legacy', '2026-10-02', -1), entry('both-again', '2026-10-03', 4, [], 2)];
    const settings = defaultHistorySettings(records);
    const series = buildHistorySeries(records, settings, range);
    expect(series.map((item) => item.name)).toEqual(['Pleasantness', 'Arousal']);
    expect(series[0]?.points.map((point) => point.value)).toEqual([2, -1, 4]);
    expect(series[1]?.points.map((point) => point.value)).toEqual([-4, 2]);
    expect(series[1]?.segments.map((segment) => segment.length)).toEqual([2]);
    expect(historySummary(records, settings, range)).toMatchObject({ median: 2, rated: 3, arousalMedian: -1, arousalRated: 2, arousalLow: -4, arousalHigh: 2 });
  });
  it('preserves multiple same-time entries and reports daily range and rating denominator', () => {
    const records = [entry('a', '2026-10-01', -5), entry('b', '2026-10-01', 5), entry('c', '2026-10-01')];
    const settings = defaultHistorySettings(records);
    expect(buildHistorySeries(records, settings, range)[0]?.points).toHaveLength(2);
    expect(buildHistorySeries(records, { ...settings, grouping: 'day' }, range)[0]?.points[0]).toMatchObject({ value: 0, low: -5, high: 5, count: 2, total: 3, entryIds: ['a', 'b', 'c'] });
  });
  it('excludes unknown intensity and treats an unmentioned feeling as missing, not zero', () => {
    const records = [entry('a', '2026-10-01', undefined, [{ feeling: 'Sad', intensity: 9 }]), entry('b', '2026-10-02', undefined, [{ feeling: 'Calm', intensity: 5 }]), entry('c', '2026-10-03', undefined, [{ feeling: 'Sad', intensity: 5, ratingSource: 'unknown' }])];
    const settings = { ...defaultHistorySettings(records), metric: 'intensity' as const, feelings: ['Sad'] };
    expect(buildHistorySeries(records, settings, range)[0]?.points.map((point) => point.value)).toEqual([9]);
    expect(historySummary(records, settings, range)).toMatchObject({ mentioned: 2, rated: 1, median: 9 });
  });
  it('uses logged entries as the frequency denominator, includes genuine zero mentions, omits empty days', () => {
    const records = [entry('a', '2026-10-01', undefined, [{ feeling: 'Sad', intensity: 5 }]), entry('b', '2026-10-01'), entry('c', '2026-10-02')];
    const settings = { ...defaultHistorySettings(records), metric: 'frequency' as const, grouping: 'day' as const, feelings: ['Sad'] };
    const points = buildHistorySeries(records, settings, range)[0]!.points;
    expect(points).toHaveLength(2); expect(points[0]).toMatchObject({ value: 50, count: 1, total: 2 }); expect(points[1]?.value).toBe(0);
  });
  it('filters on experienced date, text, need, tag, and a reported selected-feeling intensity', () => {
    const records = [{ ...entry('outside save date', '2026-10-10', 2, [{ feeling: 'Sad', intensity: 8 }]), experiencedAtISO: '2026-10-02T12:00:00Z', needs: ['support'], tags: ['work'] }, entry('other', '2026-10-02', 1)];
    const settings = { ...defaultHistorySettings(records), metric: 'intensity' as const, feelings: ['Sad'], query: 'outside', need: 'support', tag: 'WORK', minIntensity: 7 };
    expect(filterHistory(records, settings, range).map((item) => item.id)).toEqual(['outside save date']);
  });
  it('uses inclusive local calendar dates, supports previous periods, zoom, and invalid input fallback', () => {
    const settings = { ...defaultHistorySettings([]), period: 'custom' as const, from: '2026-10-01', to: '2026-10-07' };
    const window = historyWindow(settings, []);
    expect(window.days).toBe(7); expect(dateKey(window.end)).toBe('2026-10-08');
    expect(shiftWindow(window, -1)).toMatchObject({ from: '2026-09-24', to: '2026-09-30' });
    expect(dateKey(previousWindow(window).end)).toBe('2026-10-01');
    expect(zoomWindow(window, .5)).toMatchObject({ from: '2026-10-02', to: '2026-10-05' });
    expect(parseDay('2026-02-30')).toBeNull(); expect(parseDay('bad')).toBeNull();
    expect(dateKey(addDays(window.start, 7))).toBe('2026-10-08');
  });
  it('round-trips text safely through CSV and excludes reflections by default', () => {
    const records = [{ ...entry('a', '2026-10-01', -1, [], 3), notes: '=HYPERLINK("private")\nAnother line', tags: ['@unsafe'] }];
    const settings = defaultHistorySettings(records);
    expect(historyCsv(records, settings, range, false)).not.toContain('HYPERLINK');
    expect(historyCsv(records, settings, range, true)).toContain("'=HYPERLINK");
    expect(historyCsv(records, settings, range, true)).toContain("'@unsafe");
    expect(historyCsv(records, settings, range, true)).toContain('"Valence","Arousal"');
  });

  it('counts calendar days across spring and fall DST rather than dividing elapsed hours by 24', () => {
    const previousTZ = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      const settings = { ...defaultHistorySettings([]), period: 'custom' as const, from: '2026-03-07', to: '2026-03-09' };
      const spring = historyWindow(settings, []);
      expect(spring.days).toBe(3); expect((spring.end - spring.start) / 3600000).toBe(71);
      const fall = historyWindow({ ...settings, from: '2026-10-31', to: '2026-11-02' }, []);
      expect(fall.days).toBe(3); expect((fall.end - fall.start) / 3600000).toBe(73);
      expect(previousWindow(fall).days).toBe(3);
    } finally { if (previousTZ === undefined) delete process.env.TZ; else process.env.TZ = previousTZ; }
  });
});
