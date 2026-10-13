import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { addDays, calendarDay, dateKey, historyGrouping, type DateWindow, type HistoryPoint, type HistorySeries, type HistorySettings } from './historyModel';
import { journalDate, type JournalRecord } from './journalRepository';
import { gestureHistory, panHistory, zoomHistory } from './historyViewport';
import type { HistoryAnnotation } from './historyRepository';
import styles from './HistoryWorkspace.module.css';

type Props = { series: HistorySeries[]; previousSeries?: HistorySeries[]; entries: JournalRecord[]; settings: HistorySettings; range: DateWindow; annotations: HistoryAnnotation[]; printMode?: boolean; onSelect: (ids: string[], label: string, aggregate: boolean) => void; onSelectDay: (day: string) => void; onViewChange?: (view: DateWindow) => void };
export function HistoryChart({ series: currentSeries, previousSeries = [], entries, settings, range, annotations, printMode = false, onSelect, onSelectDay, onViewChange }: Props) {
  const series = [...currentSeries, ...previousSeries];
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const latestWindow = useRef(range);
  latestWindow.current = range;
  const contacts = useRef(new Map<number, { startX: number; startY: number; x: number; y: number }>());
  const gesture = useRef<{ window: DateWindow; startCenter: number; distance: number } | null>(null);
  const suppressPointerClick = useRef(false);
  const interactionActive = useRef(false);
  const [width, setWidth] = useState(printMode ? 760 : 700);
  useEffect(() => {
    if (!ref.current || printMode) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setWidth(Math.max(280, entry.contentRect.width)); });
    observer.observe(ref.current); return () => observer.disconnect();
  }, [printMode]);
  const detail = historyGrouping(settings, range) === 'entry';
  const height = width < 500 ? 310 : 350, left = width < 500 ? 40 : 51, right = width < 500 ? width - 8 : width - 20, top = detail ? 28 : 68, bottom = height - 78;
  const min = settings.metric === 'mood' ? -5 : 0, max = settings.metric === 'frequency' ? 100 : settings.metric === 'mood' ? 5 : 10;
  const x = (time: number) => left + (time - range.start) / (range.end - range.start) * (right - left);
  const y = (value: number) => bottom - (value - min) / (max - min) * (bottom - top);
  const applyView = (next: DateWindow) => { latestWindow.current = next; onViewChange?.(next); };
  const plotWidth = right - left;
  const relativeX = (clientX: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    return box?.width ? (clientX - box.left) * width / box.width - left : plotWidth / 2;
  };
  const contactSnapshot = () => {
    const points = [...contacts.current.values()];
    const center = points.reduce((sum, point) => sum + relativeX(point.x), 0) / (points.length || 1);
    const distance = points.length > 1 ? Math.abs(points[0]!.x - points[1]!.x) : 0;
    gesture.current = { window: latestWindow.current, startCenter: center, distance };
    points.forEach((point) => { point.startX = point.x; point.startY = point.y; });
  };
  const pointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!onViewChange || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (!contacts.current.size) { suppressPointerClick.current = false; interactionActive.current = false; }
    contacts.current.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
    contactSnapshot();
    if (contacts.current.size > 1) interactionActive.current = true;
  };
  const pointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = contacts.current.get(event.pointerId);
    if (!point || !onViewChange || !gesture.current) return;
    point.x = event.clientX; point.y = event.clientY;
    const points = [...contacts.current.values()];
    if (points.length === 1) {
      const dx = point.x - point.startX, dy = point.y - point.startY;
      if (!interactionActive.current && (Math.abs(dx) < 7 || Math.abs(dy) > Math.abs(dx))) return;
      if (!interactionActive.current) { interactionActive.current = true; event.currentTarget.setPointerCapture(event.pointerId); }
      suppressPointerClick.current = true;
      applyView(panHistory(gesture.current.window, -dx / plotWidth));
    } else {
      if (!interactionActive.current) interactionActive.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
      suppressPointerClick.current = true;
      const center = points.reduce((sum, item) => sum + relativeX(item.x), 0) / points.length;
      const distance = Math.abs(points[0]!.x - points[1]!.x);
      applyView(gestureHistory(gesture.current.window, gesture.current.startCenter, center, gesture.current.distance, distance, plotWidth));
    }
  };
  const pointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    contacts.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (contacts.current.size) contactSnapshot();
    else { gesture.current = null; interactionActive.current = false; }
  };
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !onViewChange || printMode) return;
    const handleWheel = (event: WheelEvent) => {
      const isZoom = event.ctrlKey || event.metaKey;
      const isHorizontal = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!isZoom && !isHorizontal) return; // Vertical wheel continues to scroll the page.
      event.preventDefault();
      const old = latestWindow.current;
      if (isZoom) {
        const rect = svg.getBoundingClientRect();
        const anchor = rect.width ? ((event.clientX - rect.left) * width / rect.width - left) / plotWidth : .5;
        applyView(zoomHistory(old, Math.exp(event.deltaY * .008), anchor));
      } else {
        applyView(panHistory(old, (event.shiftKey ? event.deltaY : event.deltaX) / plotWidth));
      }
    };
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [onViewChange, printMode, width, plotWidth, left]);
  const format = (value: number) => settings.metric === 'frequency' ? `${Math.round(value)}%` : `${settings.metric === 'mood' && value > 0 ? '+' : ''}${Math.round(value * 10) / 10}`;
  // Earlier-period overlays are visual context, never shortcuts to pages outside this day.
  const all = currentSeries.flatMap((item, index) => item.points.map((point) => ({ point, index, name: item.name })));
  const dailyCounts = new Map<string, number>();
  entries.forEach((entry) => { const day = dateKey(journalDate(entry)); dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1); });
  const countCandidates = [...dailyCounts].filter(([, count]) => count > 1).map(([day, count]) => {
    const midnight = new Date(`${day}T00:00:00`).getTime();
    const from = Math.max(midnight, range.start), to = Math.min(addDays(midnight, 1), range.end);
    return { day, count, center: x((from + to) / 2) };
  }).sort((a, b) => b.count - a.count || a.day.localeCompare(b.day));
  const shownCountCenters: number[] = [];
  const countBadges = countCandidates.filter(({ center }) => {
    if (center < left || center > right || shownCountCenters.some((placed) => Math.abs(center - placed) < 122)) return false;
    shownCountCenters.push(center); return true;
  }).sort((a, b) => a.day.localeCompare(b.day));
  const plotted = new Set(all.flatMap((item) => item.point.entryIds));
  const unscored = entries.filter((entry) => !plotted.has(entry.id));
  const missingGroups = new Map<string, JournalRecord[]>();
  unscored.forEach((entry) => { const day = dateKey(journalDate(entry)); missingGroups.set(day, [...(missingGroups.get(day) ?? []), entry]); });
  const choose = (point: HistoryPoint, name: string, clientX?: number) => {
    if (!detail) {
      // Wide touch targets may overlap on compact 30/90-day charts. Use the tapped
      // horizontal position to resolve the nearest *logged day*, not DOM paint order.
      const bounds = ref.current?.getBoundingClientRect();
      const svgX = clientX === undefined || !bounds?.width ? x(point.time) : (clientX - bounds.left) / bounds.width * width;
      const days = [...dailyCounts.keys()];
      const selected = days.reduce((best, day) => Math.abs(x(new Date(`${day}T12:00:00`).getTime()) - svgX) < Math.abs(x(new Date(`${best}T12:00:00`).getTime()) - svgX) ? day : best, dateKey(point.time));
      onSelectDay(selected); return;
    }
    // Exact timestamps and nearby marks can coincide. Offer all nearby pages rather than conceal one.
    const neighbors = all.filter((item) => Math.abs(x(item.point.time) - x(point.time)) <= 22 && Math.abs(y(item.point.value) - y(point.value)) <= 22);
    const ids = [...new Set(neighbors.flatMap((item) => item.point.entryIds))];
    onSelect(ids, `${name} · ${point.label} · ${format(point.value)}${settings.metric === 'frequency' ? ` (${point.count}/${point.total} entries mention it)` : ''}`, settings.metric === 'frequency' || ids.length > 1);
  };
  const ticks = Array.from({ length: 5 }, (_, i) => min + (max - min) * i / 4);
  const tickCount = width < 500 ? 3 : 5;
  const duration = range.end - range.start;
  const showHour = duration <= 36 * 3600000;
  const dateTicks = Array.from({ length: tickCount }, (_, i) => range.start + duration * i / (tickCount - 1));
  const dateLabel = (time: number) => {
    const date = new Date(time);
    if (showHour) return dateKey(range.start) !== dateKey(range.end - 1)
      ? date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' })
      : date.toLocaleTimeString(undefined, { hour: 'numeric' });
    return range.days > 365
      ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const barWidth = Math.max(3, Math.min(42, (right - left) / Math.max(1, range.days) * .65 / Math.max(1, series.length)));
  const shape = (index: number, cx: number, cy: number) => index === 1 ? <rect x={cx - 4} y={cy - 4} width={8} height={8} /> : index === 2 ? <path d={`M${cx},${cy - 5} l5,5 -5,5 -5,-5 Z`} /> : <circle cx={cx} cy={cy} r={4.5} />;

  return <div ref={ref} className={styles.chart} data-testid="history-chart">
    <svg ref={svgRef} className={onViewChange && !printMode ? styles.interactivePlot : undefined} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${settings.metric === 'mood' ? 'Valence and arousal, both minus 5 to plus 5' : settings.metric === 'intensity' ? 'Feeling intensity, 0 to 10' : 'Feeling mentions, percent of logged entries'} over time. Drag horizontally to move through time or pinch to zoom. Tap a day to explore its entries.`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onClickCapture={(event) => { if (suppressPointerClick.current && event.detail) { event.preventDefault(); event.stopPropagation(); suppressPointerClick.current = false; } }}>
      <text className={styles.axisTitle} x={left} y={14}>{settings.metric === 'mood' ? 'Pleasantness / arousal · −5 to +5' : settings.metric === 'intensity' ? 'Intensity · 0–10' : 'Entries mentioning feeling · %'}</text>
      {ticks.map((value) => <g key={value}><line className={value === 0 && settings.metric === 'mood' ? styles.zeroLine : styles.gridLine} x1={left} x2={right} y1={y(value)} y2={y(value)} /><text className={styles.axisText} x={left - 9} y={y(value) + 4} textAnchor="end">{format(value)}</text></g>)}
      {dateTicks.map((time, i) => <g key={time}><line className={styles.gridLine} x1={x(time)} x2={x(time)} y1={top} y2={bottom} /><text className={styles.axisText} x={x(time)} y={bottom + 24} textAnchor={i === 0 ? 'start' : i === dateTicks.length - 1 ? 'end' : 'middle'}>{dateLabel(time)}</text></g>)}
      {settings.showAnnotations ? annotations.filter((annotation) => {
        const time = new Date(`${annotation.date}T12:00:00`).getTime(); return time >= range.start && time < range.end;
      }).map((annotation) => <g key={annotation.id}><line className={styles.annotationLine} x1={x(new Date(`${annotation.date}T12:00:00`).getTime())} x2={x(new Date(`${annotation.date}T12:00:00`).getTime())} y1={top} y2={bottom} /><text className={styles.axisText} x={x(new Date(`${annotation.date}T12:00:00`).getTime())} y={top - 4} textAnchor="middle">◇<title>{annotation.date}: {annotation.label}</title></text></g>) : null}
      {series.map((item, index) => <g key={`${index}-${item.name}`} className={styles.series} data-series={index % Math.max(1, currentSeries.length)} data-previous={index >= currentSeries.length}>
        {settings.metric !== 'frequency' ? item.segments.filter((segment) => segment.length > 1).map((segment) => <path key={segment[0]!.id} className={styles.seriesLine} data-testid="history-series-line" data-series-name={item.name} fill="none" strokeDasharray={index >= currentSeries.length ? '4 6' : index === 1 ? '7 5' : index === 2 ? '2 5' : undefined} d={segment.map((point, i) => `${i ? 'L' : 'M'}${x(point.time)},${y(point.value)}`).join(' ')} />) : null}
        {item.points.map((point) => <g key={point.id}>
          {settings.metric === 'frequency' ? <rect x={x(point.time) + (index - (series.length - 1) / 2) * barWidth - barWidth / 2} y={y(point.value)} width={barWidth} height={Math.max(2, bottom - y(point.value))} fillOpacity={.32 + index * .12} /> : <>
            {!detail && point.low !== point.high ? <path className={styles.rangeLine} d={`M${x(point.time)},${y(point.low)} V${y(point.high)} M${x(point.time) - 4},${y(point.low)} h8 M${x(point.time) - 4},${y(point.high)} h8`} fill="none" /> : null}
            {shape(index % Math.max(1, currentSeries.length), x(point.time), y(point.value))}
          </>}
          {index < currentSeries.length && !printMode ? <rect className={styles.pointTarget} role="button" tabIndex={0} aria-label={`${item.name}: ${format(point.value)}, ${point.label}. ${detail ? 'Open journal entry' : `${point.total} entries; view day`}`} x={x(point.time) - 22} y={y(point.value) - 22} width={44} height={44} onClick={(event) => choose(point, item.name, event.clientX)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(point, item.name); } }}><title>{item.name}: {format(point.value)} · {point.label} · ${point.count}/${point.total} ${settings.metric === 'frequency' ? 'mention' : 'rating'} count</title></rect> : null}
        </g>)}
      </g>)}
      {missingGroups.size ? <>
        <line className={styles.gridLine} x1={left} x2={right} y1={height - 29} y2={height - 29} />
        <text className={styles.axisText} x={left} y={height - 42}>Unscored pages</text>
        {[...missingGroups].map(([day, records]) => {
          const anchor = detail ? Date.parse(journalDate(records[0]!)) : new Date(`${day}T12:00:00`).getTime();
          const cx = x(Math.max(range.start, Math.min(range.end - 1, anchor))), cy = height - 29;
          return <g key={day}><path className={styles.missingMark} d={`M${cx - 4},${cy - 4} l8,8 M${cx - 4},${cy + 4} l8,-8`} /><rect className={styles.pointTarget} x={cx - 22} y={cy - 22} width={44} height={44} role="button" tabIndex={0} aria-label={`${records.length} unscored ${records.length === 1 ? 'page' : 'pages'} on ${day}. ${!detail ? 'View day' : 'Open journal'}`} onClick={() => !detail ? onSelectDay(day) : onSelect(records.map((entry) => entry.id), `Unscored pages · ${day}`, records.length > 1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!detail) onSelectDay(day); else onSelect(records.map((entry) => entry.id), `Unscored pages · ${day}`, records.length > 1); } }} /></g>;
        })}
      </> : null}
      {!detail ? countBadges.map(({ day, count, center }) => {
        const date = new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const text = `${date} · ${count} ${count === 1 ? 'entry' : 'entries'}`;
        const labelX = Math.max(left + 59, Math.min(right - 59, center));
        return <g key={`count-${day}`}>
          <path className={styles.dayCountStem} d={`M${center},${top} V55 H${labelX}`} />
          <rect className={styles.dayCountBadge} x={labelX - 59} y={22} width={118} height={30} rx={5} />
          <text className={styles.dayCountText} x={labelX} y={41} textAnchor="middle">{text}</text>
          {!printMode ? <rect className={styles.pointTarget} x={labelX - 59} y={16} width={118} height={42} role="button" tabIndex={0} aria-label={`${count} journal entries on ${day}. View day`} onClick={() => onSelectDay(day)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectDay(day); } }} /> : null}
        </g>;
      }) : null}
      {!all.length ? <text className={styles.emptyChart} x={(left + right) / 2} y={(top + bottom) / 2} textAnchor="middle">{entries.length ? 'No numeric ratings in this view' : 'Your history will grow here'}</text> : null}
    </svg>
    <div className={styles.legend}>{currentSeries.map((item, index) => <span key={item.name}><i data-series={index} aria-hidden="true">{index === 1 ? '■ ┄' : index === 2 ? '◆ ⋯' : '● ━'}</i>{item.name}</span>)}{previousSeries.length ? <span>┄ Previous period · lighter</span> : null}{!detail && settings.metric !== 'frequency' ? <span>Daily mean · whisker = reported range</span> : null}</div>
    <p className={styles.chartNote}>{detail ? 'Individual recorded moments · tap a point or entry to read its page.' : 'Daily averages · tap a point or dated entry count to explore that day.'} {onViewChange && !printMode ? 'Drag sideways or pinch to explore time.' : ''}{settings.metric === 'frequency' ? ' Frequency shows mentions among logged entries.' : ''}{unscored.length ? ` ${unscored.length} unscored ${unscored.length === 1 ? 'page' : 'pages'} marked below.` : ''}</p>
    <span className="visually-hidden">Dates are spaced by elapsed time. {range.days} calendar days, {new Set(entries.map((entry) => calendarDay(journalDate(entry)))).size} with logged entries.</span>
  </div>;
}
