import { journalDate, type JournalRecord } from './journalRepository';

export type HistoryMetric = 'mood' | 'intensity' | 'frequency';
export type HistoryGrouping = 'entry' | 'day' | 'week';
export type HistorySettings = {
  metric: HistoryMetric; feelings: string[]; period: '7' | '30' | '90' | 'all' | 'custom'; from: string; to: string;
  grouping: HistoryGrouping; query: string; feelingFilter: string; need: string; tag: string;
  minIntensity: number; maxIntensity: number; comparison: boolean; showAnnotations: boolean;
  sort: 'newest' | 'oldest' | 'highest' | 'lowest';
};
export type DateWindow = { start: number; end: number; days: number };
export type HistoryPoint = {
  id: string; time: number; value: number; low: number; high: number; count: number; total: number;
  entryIds: string[]; label: string; day: number;
};
export type HistorySeries = { name: string; points: HistoryPoint[]; segments: HistoryPoint[][] };
const dayMs = 86400000;
export const dateKey = (value: number | string | Date) => {
  const date = new Date(value); const two = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
};
export function parseDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) && dateKey(date) === value ? date.getTime() : null;
}
export function addDays(value: number, days: number) { const date = new Date(value); date.setDate(date.getDate() + days); return date.getTime(); }
export function calendarDay(value: number | string) { const date = new Date(value); return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / dayMs; }
export function defaultHistorySettings(entries: JournalRecord[], now = new Date()): HistorySettings {
  const counts = new Map<string, { name: string; count: number }>();
  entries.forEach((entry) => entry.feelings.forEach((item) => {
    const key = item.feeling.toLocaleLowerCase(); const old = counts.get(key);
    counts.set(key, { name: item.feeling, count: (old?.count ?? 0) + 1 });
  }));
  const common = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0]?.name;
  return { metric: 'mood', feelings: common ? [common] : [],
    period: '30', from: dateKey(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), -29)), to: dateKey(now),
    grouping: 'entry', query: '', feelingFilter: '', need: '', tag: '', minIntensity: 1, maxIntensity: 10, comparison: false, showAnnotations: true, sort: 'newest' };
}
export function historyWindow(settings: HistorySettings, entries: JournalRecord[], now = new Date()): DateWindow {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let start = addDays(today, -Number(settings.period === '7' || settings.period === '90' ? settings.period : '30') + 1);
  let end = addDays(today, 1);
  if (settings.period === 'custom') {
    start = parseDay(settings.from) ?? start;
    end = addDays(parseDay(settings.to) ?? today, 1);
    if (end <= start) end = addDays(start, 1);
  } else if (settings.period === 'all' && entries.length) {
    const dates = entries.map((entry) => Date.parse(journalDate(entry))).filter(Number.isFinite);
    start = parseDay(dateKey(Math.min(...dates))) ?? start;
    end = addDays(parseDay(dateKey(Math.max(...dates, today))) ?? today, 1);
  }
  return { start, end, days: calendarDay(end) - calendarDay(start) };
}
export function previousWindow(range: DateWindow): DateWindow {
  const start = addDays(range.start, -range.days);
  return { start, end: range.start, days: range.days };
}
export function shiftWindow(range: DateWindow, direction: number) {
  return { from: dateKey(addDays(range.start, range.days * direction)), to: dateKey(addDays(range.end, range.days * direction - 1)), period: 'custom' as const };
}
export function zoomWindow(range: DateWindow, factor: number) {
  const days = Math.max(1, Math.round(range.days * factor));
  const start = addDays(range.start, Math.floor((range.days - days) / 2));
  return { from: dateKey(start), to: dateKey(addDays(start, days - 1)), period: 'custom' as const };
}
const lower = (value: string) => value.toLocaleLowerCase();
export function filterHistory(entries: JournalRecord[], settings: HistorySettings, range: DateWindow) {
  const query = lower(settings.query.trim());
  return entries.filter((entry) => {
    const time = Date.parse(journalDate(entry));
    if (time < range.start || time >= range.end) return false;
    if (settings.need && !entry.needs.includes(settings.need)) return false;
    if (settings.tag && !entry.tags.some((tag) => lower(tag) === lower(settings.tag))) return false;
    if (settings.feelingFilter && !entry.feelings.some((item) => lower(item.feeling) === lower(settings.feelingFilter))) return false;
    if (query && !lower([entry.notes, ...entry.feelings.map((item) => item.feeling), ...entry.needs, ...entry.tags].join(' ')).includes(query)) return false;
    if (settings.minIntensity !== 1 || settings.maxIntensity !== 10) {
      const selected = settings.metric === 'mood' ? [] : settings.feelings.map(lower);
      if (!entry.feelings.some((item) => item.ratingSource !== 'unknown' && (!selected.length || selected.includes(lower(item.feeling))) && item.intensity >= settings.minIntensity && item.intensity <= settings.maxIntensity)) return false;
    }
    return true;
  }).sort((a, b) => Date.parse(journalDate(a)) - Date.parse(journalDate(b)) || a.id.localeCompare(b.id));
}
export function feelingValue(entry: JournalRecord, feeling: string) {
  const item = entry.feelings.find((rating) => lower(rating.feeling) === lower(feeling));
  return item && item.ratingSource !== 'unknown' ? item.intensity : undefined;
}
export function reportedValue(entry: JournalRecord, metric: HistoryMetric, feeling: string) {
  if (metric !== 'mood') return feelingValue(entry, feeling);
  if (entry.mood?.kind !== 'rated') return undefined;
  return feeling === 'Arousal' ? entry.mood.arousal : entry.mood.value;
}
export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}
export function historySummary(entries: JournalRecord[], settings: HistorySettings, range: DateWindow) {
  const values = entries.map((entry) => reportedValue(entry, settings.metric, settings.metric === 'mood' ? 'Valence' : settings.feelings[0] ?? '')).filter((value): value is number => value !== undefined);
  const arousalValues = settings.metric === 'mood'
    ? entries.map((entry) => reportedValue(entry, 'mood', 'Arousal')).filter((value): value is number => value !== undefined)
    : [];
  return { entries: entries.length, loggedDays: new Set(entries.map((entry) => dateKey(journalDate(entry)))).size, days: range.days,
    rated: values.length, median: median(values), low: values.length ? Math.min(...values) : null, high: values.length ? Math.max(...values) : null,
    arousalRated: arousalValues.length, arousalMedian: median(arousalValues), arousalLow: arousalValues.length ? Math.min(...arousalValues) : null, arousalHigh: arousalValues.length ? Math.max(...arousalValues) : null,
    mentioned: settings.feelings[0] ? entries.filter((entry) => entry.feelings.some((item) => lower(item.feeling) === lower(settings.feelings[0]!))).length : 0,
    mixed: entries.filter((entry) => entry.mood?.kind === 'mixed').length, unsure: entries.filter((entry) => entry.mood?.kind === 'unsure').length };
}
function bucketStart(time: number, grouping: HistoryGrouping) {
  const date = new Date(time); date.setHours(0, 0, 0, 0);
  if (grouping === 'week') date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return date.getTime();
}
export function buildHistorySeries(entries: JournalRecord[], settings: HistorySettings, range: DateWindow): HistorySeries[] {
  const grouping = settings.metric === 'frequency' && settings.grouping === 'entry' ? 'day' : settings.grouping;
  const names = settings.metric === 'mood' ? ['Pleasantness', 'Arousal'] : settings.feelings.slice(0, 3);
  return names.map((name) => {
    const segments: HistoryPoint[][] = [];
    let segment: HistoryPoint[] = [];
    const points: HistoryPoint[] = [];
    const append = (point: HistoryPoint | null) => {
      if (!point) { if (segment.length) segments.push(segment); segment = []; return; }
      const previous = segment.at(-1);
      if (previous && point.day - previous.day > (grouping === 'week' ? 7 : 1)) { segments.push(segment); segment = []; }
      segment.push(point); points.push(point);
    };
    if (grouping === 'entry') {
      entries.forEach((entry) => {
        const value = reportedValue(entry, settings.metric, name);
        const time = Date.parse(journalDate(entry));
        append(value === undefined ? null : { id: `${name}-${entry.id}`, time, value, low: value, high: value, count: 1, total: 1, entryIds: [entry.id], label: new Date(time).toLocaleString(), day: calendarDay(time) });
      });
    } else {
      const buckets = new Map<number, JournalRecord[]>();
      entries.forEach((entry) => { const time = bucketStart(Date.parse(journalDate(entry)), grouping); buckets.set(time, [...(buckets.get(time) ?? []), entry]); });
      [...buckets].sort(([a], [b]) => a - b).forEach(([start, records]) => {
        const values = records.map((entry) => reportedValue(entry, settings.metric, name)).filter((value): value is number => value !== undefined);
        const mentions = records.filter((entry) => entry.feelings.some((item) => lower(item.feeling) === lower(name))).length;
        if (!values.length && settings.metric !== 'frequency') { append(null); return; }
        const from = Math.max(range.start, start), to = Math.min(range.end, addDays(start, grouping === 'week' ? 7 : 1));
        const time = from + (to - from) / 2;
        const value = settings.metric === 'frequency' ? mentions / records.length * 100 : values.reduce((sum, item) => sum + item, 0) / values.length;
        append({ id: `${name}-${start}`, time, value, low: settings.metric === 'frequency' ? value : Math.min(...values), high: settings.metric === 'frequency' ? value : Math.max(...values),
          count: settings.metric === 'frequency' ? mentions : values.length, total: records.length, entryIds: records.map((entry) => entry.id), day: calendarDay(start),
          label: grouping === 'week' ? `${new Date(from).toLocaleDateString()} – ${new Date(addDays(to, -1)).toLocaleDateString()}` : new Date(start).toLocaleDateString() });
      });
    }
    if (segment.length) segments.push(segment);
    return { name, points, segments };
  });
}

export function historyCsv(entries: JournalRecord[], settings: HistorySettings, range: DateWindow, includeText: boolean) {
  // Neutralize spreadsheet formulas in user-authored text, including tags and labels.
  const cell = (value: string | number) => `"${String(typeof value === 'string' && /^[\s]*[=+@-]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  const row = (values: (string | number)[]) => values.map(cell).join(',');
  const fields = ['Entry ID', 'Moment (ISO)', 'Originally saved (ISO)', 'Valence', 'Arousal', 'Mood status', 'Feelings and reported intensity', 'Needs', 'Tags', ...(includeText ? ['Reflection'] : [])];
  return [row(['allneeds emotional history']), row(['Period', dateKey(range.start), dateKey(addDays(range.end, -1))]),
    row(['Measure', settings.metric, 'Grouping', settings.grouping, 'Feelings', settings.metric === 'mood' ? '' : settings.feelings.join('; ')]),
    row(['Filters', JSON.stringify({ query: settings.query, feeling: settings.feelingFilter, need: settings.need, tag: settings.tag, intensity: [settings.minIntensity, settings.maxIntensity] })]),
    row(fields), ...entries.map((entry) => row([entry.id, journalDate(entry), entry.createdAtISO ?? entry.dateISO,
      entry.mood?.kind === 'rated' ? entry.mood.value : '', entry.mood?.kind === 'rated' ? entry.mood.arousal ?? '' : '', entry.mood?.kind ?? 'not rated',
      entry.feelings.map((item) => `${item.feeling}: ${item.ratingSource === 'unknown' ? 'not recorded' : `${item.intensity}/10`}`).join('; '), entry.needs.join('; '), entry.tags.join('; '), ...(includeText ? [entry.notes] : [])]))].join('\r\n');
}
