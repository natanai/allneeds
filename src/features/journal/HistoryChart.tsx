import { useEffect, useRef, useState } from 'react';
import { addDays, calendarDay, dateKey, type DateWindow, type HistoryPoint, type HistorySeries, type HistorySettings } from './historyModel';
import { journalDate, type JournalRecord } from './journalRepository';
import type { HistoryAnnotation } from './historyRepository';
import styles from './HistoryWorkspace.module.css';

type Props = { series: HistorySeries[]; previousSeries?: HistorySeries[]; entries: JournalRecord[]; settings: HistorySettings; range: DateWindow; annotations: HistoryAnnotation[]; printMode?: boolean; onSelect: (ids: string[], label: string, aggregate: boolean) => void; onSelectDay: (day: string) => void };
export function HistoryChart({ series: currentSeries, previousSeries = [], entries, settings, range, annotations, printMode = false, onSelect, onSelectDay }: Props) {
  const series = [...currentSeries, ...previousSeries];
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(printMode ? 760 : 700);
  useEffect(() => {
    if (!ref.current || printMode) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setWidth(Math.max(280, entry.contentRect.width)); });
    observer.observe(ref.current); return () => observer.disconnect();
  }, [printMode]);
  const height = width < 500 ? 310 : 350, left = width < 500 ? 40 : 51, right = width < 500 ? width - 8 : width - 20, top = range.days === 1 ? 28 : 58, bottom = height - 78;
  const min = settings.metric === 'mood' ? -5 : 0, max = settings.metric === 'frequency' ? 100 : settings.metric === 'mood' ? 5 : 10;
  const x = (time: number) => left + (time - range.start) / (range.end - range.start) * (right - left);
  const y = (value: number) => bottom - (value - min) / (max - min) * (bottom - top);
  const format = (value: number) => settings.metric === 'frequency' ? `${Math.round(value)}%` : `${settings.metric === 'mood' && value > 0 ? '+' : ''}${Math.round(value * 10) / 10}`;
  // Earlier-period overlays are visual context, never shortcuts to pages outside this day.
  const all = currentSeries.flatMap((item, index) => item.points.map((point) => ({ point, index, name: item.name })));
  const dailyCounts = new Map<string, number>();
  entries.forEach((entry) => { const day = dateKey(journalDate(entry)); dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1); });
  const countCandidates = [...dailyCounts].filter(([, count]) => count > 1).map(([day, count]) => ({ day, count, center: x(new Date(`${day}T12:00:00`).getTime()) })).sort((a, b) => b.count - a.count || a.day.localeCompare(b.day));
  const shownCountCenters: number[] = [];
  const countBadges = countCandidates.filter(({ center }) => {
    if (center < left + 12 || center > right - 12 || shownCountCenters.some((placed) => Math.abs(center - placed) < 24)) return false;
    shownCountCenters.push(center); return true;
  }).sort((a, b) => a.day.localeCompare(b.day));
  const plotted = new Set(all.flatMap((item) => item.point.entryIds));
  const unscored = entries.filter((entry) => !plotted.has(entry.id));
  const missingGroups = new Map<string, JournalRecord[]>();
  unscored.forEach((entry) => { const day = dateKey(journalDate(entry)); missingGroups.set(day, [...(missingGroups.get(day) ?? []), entry]); });
  const choose = (point: HistoryPoint, name: string) => {
    if (range.days > 1) { onSelectDay(dateKey(point.time)); return; }
    // Exact timestamps and nearby marks can coincide. Offer all nearby pages rather than conceal one.
    const neighbors = all.filter((item) => Math.abs(x(item.point.time) - x(point.time)) <= 22 && Math.abs(y(item.point.value) - y(point.value)) <= 22);
    const ids = [...new Set(neighbors.flatMap((item) => item.point.entryIds))];
    onSelect(ids, `${name} · ${point.label} · ${format(point.value)}${range.days > 1 && settings.metric !== 'frequency' ? ` mean (${point.count}/${point.total} rated; range ${format(point.low)} to ${format(point.high)})` : settings.metric === 'frequency' ? ` (${point.count}/${point.total} entries mention it)` : ''}`, range.days > 1 || settings.metric === 'frequency' || ids.length > 1);
  };
  const ticks = Array.from({ length: 5 }, (_, i) => min + (max - min) * i / 4);
  const tickCount = width < 500 ? 3 : 5;
  const dateTicks = range.days === 1
    ? [0, 6, 12, 18].map((hour) => { const date = new Date(range.start); date.setHours(hour, 0, 0, 0); return date.getTime(); }).filter((time) => time >= range.start && time < range.end)
    : [...new Set(Array.from({ length: tickCount }, (_, i) => Math.min(range.end - 1, addDays(range.start, Math.round((range.days - 1) * i / (tickCount - 1))))))];
  const barWidth = Math.max(3, Math.min(42, (right - left) / Math.max(1, range.days) * .65 / Math.max(1, series.length)));
  const shape = (index: number, cx: number, cy: number) => index === 1 ? <rect x={cx - 4} y={cy - 4} width={8} height={8} /> : index === 2 ? <path d={`M${cx},${cy - 5} l5,5 -5,5 -5,-5 Z`} /> : <circle cx={cx} cy={cy} r={4.5} />;

  return <div ref={ref} className={styles.chart} data-testid="history-chart">
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${settings.metric === 'mood' ? 'Valence and arousal, both minus 5 to plus 5' : settings.metric === 'intensity' ? 'Feeling intensity, 0 to 10' : 'Feeling mentions, percent of logged entries'} over time. Activate a day to see its individual entries, then open a journal page.`}>
      <text className={styles.axisTitle} x={left} y={14}>{settings.metric === 'mood' ? 'Pleasantness / arousal · −5 to +5' : settings.metric === 'intensity' ? 'Intensity · 0–10' : 'Entries mentioning feeling · %'}</text>
      {ticks.map((value) => <g key={value}><line className={value === 0 && settings.metric === 'mood' ? styles.zeroLine : styles.gridLine} x1={left} x2={right} y1={y(value)} y2={y(value)} /><text className={styles.axisText} x={left - 9} y={y(value) + 4} textAnchor="end">{format(value)}</text></g>)}
      {dateTicks.map((time, i) => <g key={time}><line className={styles.gridLine} x1={x(time)} x2={x(time)} y1={top} y2={bottom} /><text className={styles.axisText} x={x(time)} y={bottom + 24} textAnchor={i === 0 ? 'start' : i === dateTicks.length - 1 ? 'end' : 'middle'}>{range.days === 1 ? new Date(time).toLocaleTimeString(undefined, { hour: 'numeric' }) : new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(range.days > 365 ? { year: '2-digit' } : {}) })}</text></g>)}
      {range.days > 1 ? countBadges.map(({ day, count, center }) => <g key={`count-${day}`}>
        <circle className={styles.dayCountBadge} cx={center} cy={36} r={11} />
        <text className={styles.dayCountText} x={center} y={40} textAnchor="middle">{count}</text>
        {!printMode ? <rect className={styles.pointTarget} x={center - 14} y={22} width={28} height={28} role="button" tabIndex={0} aria-label={`${count} journal entries on ${day}. View day`} onClick={() => onSelectDay(day)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectDay(day); } }} /> : null}
      </g>) : null}
      {settings.showAnnotations ? annotations.filter((annotation) => {
        const time = new Date(`${annotation.date}T12:00:00`).getTime(); return time >= range.start && time < range.end;
      }).map((annotation) => <g key={annotation.id}><line className={styles.annotationLine} x1={x(new Date(`${annotation.date}T12:00:00`).getTime())} x2={x(new Date(`${annotation.date}T12:00:00`).getTime())} y1={top} y2={bottom} /><text className={styles.axisText} x={x(new Date(`${annotation.date}T12:00:00`).getTime())} y={top - 4} textAnchor="middle">◇<title>{annotation.date}: {annotation.label}</title></text></g>) : null}
      {series.map((item, index) => <g key={`${index}-${item.name}`} className={styles.series} data-series={index % Math.max(1, currentSeries.length)} data-previous={index >= currentSeries.length}>
        {settings.metric !== 'frequency' ? item.segments.filter((segment) => segment.length > 1).map((segment) => <path key={segment[0]!.id} className={styles.seriesLine} data-testid="history-series-line" data-series-name={item.name} fill="none" strokeDasharray={index >= currentSeries.length ? '4 6' : index === 1 ? '7 5' : index === 2 ? '2 5' : undefined} d={segment.map((point, i) => `${i ? 'L' : 'M'}${x(point.time)},${y(point.value)}`).join(' ')} />) : null}
        {item.points.map((point) => <g key={point.id}>
          {settings.metric === 'frequency' ? <rect x={x(point.time) + (index - (series.length - 1) / 2) * barWidth - barWidth / 2} y={y(point.value)} width={barWidth} height={Math.max(2, bottom - y(point.value))} fillOpacity={.32 + index * .12} /> : <>
            {range.days > 1 && point.low !== point.high ? <path className={styles.rangeLine} d={`M${x(point.time)},${y(point.low)} V${y(point.high)} M${x(point.time) - 4},${y(point.low)} h8 M${x(point.time) - 4},${y(point.high)} h8`} fill="none" /> : null}
            {shape(index % Math.max(1, currentSeries.length), x(point.time), y(point.value))}
          </>}
          {index < currentSeries.length && !printMode ? <rect className={styles.pointTarget} role="button" tabIndex={0} aria-label={`${item.name}: ${format(point.value)}, ${point.label}. ${range.days === 1 && settings.metric !== 'frequency' ? 'Open journal entry' : `${point.total} entries; view day`}`} x={x(point.time) - 22} y={y(point.value) - 22} width={44} height={44} onClick={() => choose(point, item.name)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(point, item.name); } }}><title>{item.name}: {format(point.value)} · {point.label} · ${point.count}/${point.total} rated or mentioned</title></rect> : null}
        </g>)}
      </g>)}
      {missingGroups.size ? <>
        <line className={styles.gridLine} x1={left} x2={right} y1={height - 29} y2={height - 29} />
        <text className={styles.axisText} x={left} y={height - 42}>Unscored pages</text>
        {[...missingGroups].map(([day, records]) => {
          const cx = x(range.days > 1 ? new Date(`${day}T12:00:00`).getTime() : Date.parse(journalDate(records[0]!))), cy = height - 29;
          return <g key={day}><path className={styles.missingMark} d={`M${cx - 4},${cy - 4} l8,8 M${cx - 4},${cy + 4} l8,-8`} /><rect className={styles.pointTarget} x={cx - 22} y={cy - 22} width={44} height={44} role="button" tabIndex={0} aria-label={`${records.length} unscored ${records.length === 1 ? 'page' : 'pages'} on ${day}. Open journal`} onClick={() => range.days > 1 ? onSelectDay(day) : onSelect(records.map((entry) => entry.id), `Unscored pages · ${day}`, records.length > 1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (range.days > 1) onSelectDay(day); else onSelect(records.map((entry) => entry.id), `Unscored pages · ${day}`, records.length > 1); } }} /></g>;
        })}
      </> : null}
      {!all.length ? <text className={styles.emptyChart} x={(left + right) / 2} y={(top + bottom) / 2} textAnchor="middle">{entries.length ? 'No numeric ratings in this view' : 'Your history will grow here'}</text> : null}
    </svg>
    <div className={styles.legend}>{currentSeries.map((item, index) => <span key={item.name}><i data-series={index} aria-hidden="true">{index === 1 ? '■ ┄' : index === 2 ? '◆ ⋯' : '● ━'}</i>{item.name}</span>)}{previousSeries.length ? <span>┄ Previous period · lighter</span> : null}{range.days > 1 && settings.metric !== 'frequency' ? <span>Point = daily mean · whisker = reported range</span> : null}{range.days > 1 ? <span>Number = entries that day (when space allows)</span> : null}</div>
    <p className={styles.chartNote}>{range.days > 1 ? 'Select a day on the graph to see each entry. Daily means use only recorded ratings; the count includes unrated entries.' : 'Select an individual point to open its journal page, or use the entry list. '}{settings.metric === 'frequency' ? ' Bars show the share of logged entries mentioning a feeling; not mentioned does not mean not felt.' : ' Lines connect recorded points; they do not estimate the time between them.'}{unscored.length ? ` ${unscored.length} unscored ${unscored.length === 1 ? 'page is' : 'pages are'} marked below the graph.` : ''}</p>
    <span className="visually-hidden">Dates are spaced by elapsed time. {range.days} calendar days, {new Set(entries.map((entry) => calendarDay(journalDate(entry)))).size} with logged entries.</span>
  </div>;
}
