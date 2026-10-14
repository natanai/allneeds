import { useCallback, useEffect, useMemo, useState } from 'react';
import { DisclosureRow } from '../../components/disclosure/DisclosureRow';
import { OverlayShell } from '../../components/overlays/OverlayShell';
import { needsBySlug } from '../../data/catalog';
import { formatJournalDate } from './JournalBook';
import { HistoryChart } from './HistoryChart';
import { addDays, buildHistorySeries, dateKey, defaultHistorySettings, filterHistory, historyCsv, historyGrouping, historySummary, historyWindow, previousWindow, reportedValue, shiftWindow, type DateWindow, type HistorySettings } from './historyModel';
import { readHistoryAnnotations, readHistorySettings, writeHistoryAnnotations, writeHistorySettings } from './historyRepository';
import { journalDate, type JournalRecord } from './journalRepository';
import { MAX_VISIBLE_MS, MIN_VISIBLE_MS, panHistory, visibleWindow, zoomHistory } from './historyViewport';
import styles from './HistoryWorkspace.module.css';

type Props = { entries: JournalRecord[]; onOpenEntry: (id: string) => void };
const number = (value: number | null) => value === null ? '—' : String(Math.round(value * 10) / 10);
export function HistoryWorkspace({ entries, onOpenEntry }: Props) {
  const [settings, setSettings] = useState(() => readHistorySettings(defaultHistorySettings(entries)));
  const [annotations, setAnnotations] = useState(readHistoryAnnotations);
  const [annotationDate, setAnnotationDate] = useState(() => dateKey(new Date()));
  const [annotationLabel, setAnnotationLabel] = useState('');
  const [annotationError, setAnnotationError] = useState('');
  const [selection, setSelection] = useState<{ ids: string[]; label: string } | null>(null);
  const [returnView, setReturnView] = useState<(Pick<HistorySettings, 'period' | 'from' | 'to'> & { viewport: DateWindow | null }) | null>(null);
  const [viewport, setViewport] = useState<DateWindow | null>(null);
  const changeViewport = useCallback((next: DateWindow) => setViewport(next), []);
  const [exportOpen, setExportOpen] = useState(false);
  const [includeText, setIncludeText] = useState(false);
  const [feedback, setFeedback] = useState('');
  useEffect(() => { writeHistorySettings(settings); setSelection(null); }, [settings]);
  const patch = (value: Partial<HistorySettings>) => setSettings((current) => ({ ...current, ...value }));
  const changePeriod = (value: Partial<HistorySettings>) => { setReturnView(null); setViewport(null); patch(value); };
  const savedRange = useMemo(() => historyWindow(settings, entries), [entries, settings]);
  const range = viewport ?? savedRange;
  const isSingleDay = historyGrouping(settings, range) === 'entry' || range.days === 1 || range.end - range.start <= 86400000;
  const gestureZoom = (factor: number) => setViewport(zoomHistory(range, factor, .75));
  const drillIntoDay = (day: string) => {
    if (isSingleDay) return;
    setReturnView({ period: settings.period, from: settings.from, to: settings.to, viewport });
    setViewport(null);
    patch({ period: 'custom', from: day, to: day });
  };
  const backToPeriod = () => {
    if (!returnView) return;
    patch({ period: returnView.period, from: returnView.from, to: returnView.to });
    setViewport(returnView.viewport);
    setReturnView(null);
  };
  const previousRange = useMemo(() => viewport ? visibleWindow(range.start - (range.end - range.start), range.start) : previousWindow(range), [range, viewport]);
  const matching = useMemo(() => filterHistory(entries, settings, range), [entries, range, settings]);
  const previous = useMemo(() => filterHistory(entries, settings, previousRange), [entries, previousRange, settings]);
  const series = useMemo(() => buildHistorySeries(matching, settings, range), [matching, range, settings]);
  const previousSeries = useMemo(() => settings.comparison ? buildHistorySeries(previous, settings, previousRange).map((item) => ({ ...item, previous: true,
    points: item.points.map((point) => ({ ...point, time: viewport ? point.time + range.end - range.start : addDays(point.time, range.days), day: point.day + range.days })),
    segments: item.segments.map((segment) => segment.map((point) => ({ ...point, time: viewport ? point.time + range.end - range.start : addDays(point.time, range.days), day: point.day + range.days }))),
  })) : [], [previous, previousRange, range.days, range.end, range.start, settings, viewport]);
  const summary = historySummary(matching, settings, range), priorSummary = historySummary(previous, settings, previousRange);
  const options = useMemo(() => ({
    feelings: [...new Map(entries.flatMap((entry) => entry.feelings.map((item) => [item.feeling.toLocaleLowerCase(), item.feeling] as const))).values()].sort((a, b) => a.localeCompare(b)),
    needs: [...new Set(entries.flatMap((entry) => entry.needs))].sort(), tags: [...new Set(entries.flatMap((entry) => entry.tags))].sort(),
  }), [entries]);
  const visibleEntries = [...matching].sort((a, b) => {
    if (settings.sort === 'highest' || settings.sort === 'lowest') {
      const av = reportedValue(a, settings.metric, settings.feelings[0] ?? ''), bv = reportedValue(b, settings.metric, settings.feelings[0] ?? '');
      if (av === undefined) return bv === undefined ? 0 : 1; if (bv === undefined) return -1;
      return settings.sort === 'highest' ? bv - av : av - bv;
    }
    return (settings.sort === 'oldest' ? 1 : -1) * journalDate(a).localeCompare(journalDate(b));
  });
  // Keep the overview legible: report real within-day variation as words when
  // someone opens the day, rather than overlaying unexplained whiskers on the chart.
  const dayRanges = useMemo(() => {
    if (!isSingleDay || settings.metric === 'frequency') return [];
    const names = settings.metric === 'mood' ? ['Pleasantness', 'Arousal'] : settings.feelings.slice(0, 3);
    return names.flatMap((name) => {
      const values = matching.map((entry) => reportedValue(entry, settings.metric, name)).filter((value): value is number => value !== undefined);
      if (values.length < 2) return [];
      const low = Math.min(...values), high = Math.max(...values);
      return low === high ? [] : [{ name, low, high, rated: values.length }];
    });
  }, [isSingleDay, matching, settings.metric, settings.feelings]);
  const formatScore = (value: number) => `${settings.metric === 'mood' && value > 0 ? '+' : ''}${number(value)}`;
  const focusCount = [settings.query, settings.feelingFilter, settings.need, settings.tag, settings.minIntensity !== 1 || settings.maxIntensity !== 10].filter(Boolean).length;
  const currentDates = viewport && range.end - range.start < 36 * 3600000
    ? `${new Date(range.start).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} – ${new Date(range.end).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
    : isSingleDay ? new Date(range.start).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : `${new Date(range.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(range.end - 1).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const priorDates = `${dateKey(previousRange.start)} – ${dateKey(addDays(previousRange.end, -1))}`;
  const selectPoints = (ids: string[], label: string, aggregate: boolean) => {
    if (!aggregate && ids.length === 1) onOpenEntry(ids[0]!); else setSelection({ ids, label });
  };
  const addAnnotation = () => {
    if (!annotationDate || !annotationLabel.trim()) return;
    try {
      setAnnotations(writeHistoryAnnotations([...annotations, { id: crypto.randomUUID(), date: annotationDate, label: annotationLabel.trim().slice(0, 160) }]));
      setAnnotationLabel(''); setAnnotationError('');
    } catch { setAnnotationError('The note could not be saved. Check device storage and try again.'); }
  };
  const exportCsv = () => {
    const content = historyCsv(matching, settings, range, includeText);
    const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `allneeds-history-${dateKey(range.start)}-${dateKey(addDays(range.end, -1))}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setFeedback(`Exported ${matching.length} matching entries${includeText ? ' with reflections' : ' without reflections'}.`);
  };
  const entryButton = (entry: JournalRecord, showNote = false) => <button type="button" className={styles.entryButton} key={entry.id} onClick={() => onOpenEntry(entry.id)}>
    <time dateTime={journalDate(entry)}>{formatJournalDate(journalDate(entry))}</time>
    {entry.experiencedAtISO && dateKey(entry.experiencedAtISO) !== dateKey(entry.createdAtISO ?? entry.dateISO) ? <small>Plotted by experienced date · originally saved {formatJournalDate(entry.createdAtISO ?? entry.dateISO)}</small> : null}
    <strong>{entry.feelings.map((item) => `${item.feeling}${item.ratingSource === 'unknown' ? ' · not rated' : ` ${item.intensity}/10`}`).join(' · ') || 'Reflection'}</strong>
    <small>{entry.mood?.kind === 'rated' ? `Valence ${entry.mood.value > 0 ? '+' : ''}${entry.mood.value}${entry.mood.arousal === undefined ? ' · arousal not recorded' : ` · Arousal ${entry.mood.arousal > 0 ? '+' : ''}${entry.mood.arousal}`}` : entry.mood?.kind === 'mixed' ? 'Mixed feelings' : entry.mood?.kind === 'unsure' ? 'Emotional coordinates: not sure' : 'Emotional coordinates not recorded'}{entry.tags.length ? ` · ${entry.tags.map((tag) => `#${tag}`).join(' ')}` : ''}</small>
    {showNote && entry.notes ? <span className={styles.notePreview}>{entry.notes}</span> : null}
    <span className={styles.openPage}>Open journal page →</span>
  </button>;

  return <section className={styles.workspace} aria-label="Emotional history">
    <div className={styles.graphCard} data-history-print>
      {returnView ? <div className={styles.dayNavigation}><button type="button" aria-label="Back to all days" onClick={backToPeriod}>← All days</button><span>{currentDates}</span></div> : null}
      <HistoryChart series={series} previousSeries={previousSeries} entries={matching} settings={settings} range={range} annotations={annotations} onSelect={selectPoints} onSelectDay={drillIntoDay} onViewChange={changeViewport} />
      {isSingleDay ? <section className={styles.dayEntries} aria-label="Entries on selected day"><header><strong>{matching.length} {matching.length === 1 ? 'entry' : 'entries'} · {currentDates}</strong></header>{dayRanges.length ? <div className={styles.dayRanges} aria-label="Recorded rating ranges">{dayRanges.map(({ name, low, high, rated }) => <p key={name}><strong>{name}:</strong> {formatScore(low)} to {formatScore(high)} across {rated} recorded ratings</p>)}</div> : null}<div className={styles.entryList}>{visibleEntries.map((entry) => entryButton(entry, true))}</div>{!matching.length ? <p className={styles.subtle}>No entries match these filters in this time window.</p> : null}</section> : null}
      {selection ? <section className={styles.selection} aria-label="Selected graph entries"><header><strong>{selection.label}</strong><button type="button" onClick={() => setSelection(null)}>Dismiss</button></header><p>{selection.ids.length} {selection.ids.length === 1 ? 'page' : 'pages'} at this part of the graph.</p><div className={styles.selectionList}>{entries.filter((entry) => selection.ids.includes(entry.id)).map((entry) => entryButton(entry))}</div></section> : null}
      <div className={styles.graphControls} aria-label="Graph controls">
        <div className={styles.controlHeading}><strong>Change the view</strong><button type="button" onClick={() => { setIncludeText(false); setExportOpen(true); }}>Print / export</button></div>
        <form className={styles.controls} onSubmit={(event) => event.preventDefault()}>
          <label>Period<select aria-label="Period" value={viewport ? 'exploring' : settings.period} onChange={(event) => changePeriod({ period: event.target.value as HistorySettings['period'] })}>{viewport ? <option value="exploring">Exploring</option> : null}<option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="all">All time</option><option value="custom">Custom dates</option></select></label>
          <label>Show<select aria-label="History measure" value={settings.metric} onChange={(event) => {
            const metric = event.target.value as HistorySettings['metric'];
            patch({ metric, feelings: settings.feelings.length ? settings.feelings : options.feelings.slice(0, 1) });
          }}><option value="mood">Pleasantness &amp; arousal</option><option value="intensity">Feeling intensity</option><option value="frequency">Feeling frequency</option></select></label>
          
        </form>
        <p className={styles.detailHint}>{isSingleDay ? settings.metric === 'frequency' ? 'Frequency among recorded entries · zoom or drag to explore time' : 'Individual recorded moments · zoom or drag to explore time' : settings.metric === 'frequency' ? 'Daily share · pinch or drag the graph to explore time' : 'Daily averages · pinch or drag the graph to explore time'}</p>
        {!viewport && settings.period === 'custom' ? <div className={styles.dateRange}><label>From<input aria-label="Start date" type="date" value={settings.from} max={settings.to || undefined} onChange={(event) => changePeriod({ from: event.target.value })} /></label><label>Through<input aria-label="End date" type="date" min={settings.from || undefined} value={settings.to} onChange={(event) => changePeriod({ to: event.target.value })} /></label></div> : null}
        {settings.metric !== 'mood' ? <div className={styles.seriesControls} aria-label="Feelings on the graph">
          {[0, 1, 2].map((index) => <label key={index}>{index === 0 ? 'Feeling' : `Compare ${index}`}<select aria-label={index === 0 ? 'Graph feeling' : `Compare feeling ${index}`} value={settings.feelings[index] ?? ''} onChange={(event) => {
            const next = [...settings.feelings]; next[index] = event.target.value;
            patch({ feelings: [...new Set(next.filter(Boolean))] });
          }}><option value="">{index === 0 ? 'Choose a feeling' : 'None'}</option>{options.feelings.filter((feeling) => feeling === settings.feelings[index] || !settings.feelings.includes(feeling)).map((feeling) => <option key={feeling}>{feeling}</option>)}</select></label>)}
        </div> : null}
        <div className={styles.timelineNav}><button type="button" aria-label="Previous period" onClick={() => viewport ? setViewport(panHistory(range, -1)) : patch(shiftWindow(range, -1))}>←</button><strong>{currentDates}</strong><button type="button" aria-label="Next period" onClick={() => viewport ? setViewport(panHistory(range, 1)) : patch(shiftWindow(range, 1))}>→</button><button type="button" onClick={() => gestureZoom(.5)} disabled={range.end - range.start <= MIN_VISIBLE_MS}>Zoom in</button><button type="button" onClick={() => gestureZoom(2)} disabled={range.end - range.start >= MAX_VISIBLE_MS}>Zoom out</button>{viewport ? <button type="button" onClick={() => { setViewport(null); setReturnView(null); }}>Reset zoom</button> : null}</div>
        {settings.metric === 'mood' && !entries.some((entry) => entry.mood?.kind === 'rated') ? <p className={styles.subtle}>Place a point in the Journal to begin the pleasantness and arousal lines.</p> : null}
      </div>
      <div className={styles.reviewSummary} aria-label="Period summary">
        <article><strong>{summary.entries}</strong><span>matching entries</span></article><article><strong>{summary.loggedDays} / {summary.days}</strong><span>days with entries</span></article>
        {settings.metric === 'frequency' ? <><article><strong>{summary.mentioned} / {summary.entries}</strong><span>entries mention {settings.feelings[0] ?? 'a selected feeling'}</span></article><article><strong>{summary.entries ? `${Math.round(summary.mentioned / summary.entries * 100)}%` : '—'}</strong><span>share of logged entries</span></article></> : settings.metric === 'mood' ? <><article><strong>{number(summary.median)}</strong><span>median pleasantness · {summary.rated} ratings{summary.low === null ? '' : ` · range ${number(summary.low)} to ${number(summary.high)}`}</span></article><article><strong>{number(summary.arousalMedian)}</strong><span>median arousal · {summary.arousalRated} ratings{summary.arousalLow === null ? '' : ` · range ${number(summary.arousalLow)} to ${number(summary.arousalHigh)}`}</span></article></> : <><article><strong>{number(summary.median)}</strong><span>median {settings.feelings[0] ?? 'intensity'} · {summary.rated} ratings</span></article><article><strong>{summary.low === null ? '—' : `${number(summary.low)} to ${number(summary.high)}`}</strong><span>reported range</span></article></>}
      </div>
      {settings.metric === 'mood' && (summary.mixed || summary.unsure) ? <p className={styles.subtle}>{summary.mixed} mixed · {summary.unsure} not sure. These pages have no numeric coordinates.</p> : null}
      {!matching.length ? <p className={styles.subtle}>{entries.length ? 'No entries match this period and these filters. Try All time or reset the view.' : 'Write your first journal page. Mood and feelings are optional; your words can be enough.'}</p> : null}
      <DisclosureRow title="Focus & compare" description={focusCount ? `${focusCount} active filters` : 'Feelings, intensity, needs, tags, and periods'}>
        <form className={styles.focusControls} aria-label="Filter journal history" onSubmit={(event) => event.preventDefault()}>
          <label className={styles.search}>Search journal<input type="search" aria-label="Search journal" value={settings.query} placeholder="Words in reflections, feelings, needs or tags" onChange={(event) => patch({ query: event.target.value })} /></label>
          <label>Feeling in entry<select aria-label="Filter feeling" value={settings.feelingFilter} onChange={(event) => patch({ feelingFilter: event.target.value })}><option value="">Any feeling</option>{options.feelings.map((feeling) => <option key={feeling}>{feeling}</option>)}</select></label>
          <label>Need<select aria-label="Need" value={settings.need} onChange={(event) => patch({ need: event.target.value })}><option value="">Any need</option>{options.needs.map((slug) => <option key={slug} value={slug}>{needsBySlug.get(slug)?.title ?? slug}</option>)}</select></label>
          <label>Tag<select aria-label="Tag" value={settings.tag} onChange={(event) => patch({ tag: event.target.value })}><option value="">Any tag</option>{options.tags.map((tag) => <option key={tag}>{tag}</option>)}</select></label>
          <label>Minimum intensity<select aria-label="Minimum intensity" value={settings.minIntensity} onChange={(event) => patch({ minIntensity: Number(event.target.value), maxIntensity: Math.max(settings.maxIntensity, Number(event.target.value)) })}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label>
          <label>Maximum intensity<select aria-label="Maximum intensity" value={settings.maxIntensity} onChange={(event) => patch({ maxIntensity: Number(event.target.value), minIntensity: Math.min(settings.minIntensity, Number(event.target.value)) })}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label>
          <p className={styles.subtle}>Intensity filters keep entries with a reported rating in this range for a plotted feeling, or any feeling in the mood view.</p>
          <label className={styles.check}><input type="checkbox" checked={settings.comparison} onChange={(event) => patch({ comparison: event.target.checked })} />Compare with the previous equal-length period</label>
          <button type="button" onClick={() => { setReturnView(null); setSettings(defaultHistorySettings(entries)); setFeedback('View reset to the default 30 days.'); }}>Reset view</button>
        </form>
      </DisclosureRow>
      {focusCount ? <div className={styles.activeFilters} aria-label="Active history filters">{settings.query ? <span>Search: {settings.query}</span> : null}{settings.feelingFilter ? <span>Feeling: {settings.feelingFilter}</span> : null}{settings.need ? <span>Need: {needsBySlug.get(settings.need)?.title ?? settings.need}</span> : null}{settings.tag ? <span>Tag: #{settings.tag}</span> : null}{settings.minIntensity !== 1 || settings.maxIntensity !== 10 ? <span>Intensity: {settings.minIntensity}–{settings.maxIntensity}</span> : null}<button type="button" onClick={() => patch({ query: '', feelingFilter: '', need: '', tag: '', minIntensity: 1, maxIntensity: 10 })}>Clear filters</button></div> : null}
      {settings.comparison ? <section className={styles.comparison} aria-label="Period comparison"><h3>Same length, earlier period</h3><p>{priorDates} · earlier points are aligned by day of period and shown with lighter dashed lines.</p><div className={styles.tableScroll}><table><caption>Matching entries under the same filters</caption><thead><tr><th scope="col">Measure</th><th scope="col">Current</th><th scope="col">Previous</th></tr></thead><tbody>
        <tr><th scope="row">Entries</th><td>{summary.entries}</td><td>{priorSummary.entries}</td></tr><tr><th scope="row">Days with entries</th><td>{summary.loggedDays} / {range.days}</td><td>{priorSummary.loggedDays} / {range.days}</td></tr>
        {settings.metric === 'frequency' ? <tr><th scope="row">Mentions / entries</th><td>{summary.mentioned} / {summary.entries}</td><td>{priorSummary.mentioned} / {priorSummary.entries}</td></tr> : settings.metric === 'mood' ? <><tr><th scope="row">Median pleasantness</th><td>{number(summary.median)} · {summary.rated} ratings</td><td>{number(priorSummary.median)} · {priorSummary.rated} ratings</td></tr><tr><th scope="row">Median arousal</th><td>{number(summary.arousalMedian)} · {summary.arousalRated} ratings</td><td>{number(priorSummary.arousalMedian)} · {priorSummary.arousalRated} ratings</td></tr></> : <><tr><th scope="row">Median · first series</th><td>{number(summary.median)} · {summary.rated} ratings</td><td>{number(priorSummary.median)} · {priorSummary.rated} ratings</td></tr><tr><th scope="row">Reported range</th><td>{summary.low === null ? '—' : `${number(summary.low)} to ${number(summary.high)}`}</td><td>{priorSummary.low === null ? '—' : `${number(priorSummary.low)} to ${number(priorSummary.high)}`}</td></tr></>}
      </tbody></table></div></section> : null}
    </div>
    {!isSingleDay ? <DisclosureRow variant="card" title="Journal entries" description={`${matching.length} pages in this view · open a page in the Journal`} defaultOpen={!entries.length}>
      <label className={styles.sort}>Sort<select aria-label="Sort" value={settings.sort} onChange={(event) => patch({ sort: event.target.value as HistorySettings['sort'] })}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest">Highest plotted rating</option><option value="lowest">Lowest plotted rating</option></select></label>
      <div className={styles.entryList}>{visibleEntries.map((entry) => entryButton(entry, true))}</div>
      {!visibleEntries.length ? <p className={styles.subtle}>{entries.length ? 'No matching entries.' : 'No entries yet.'}</p> : null}
    </DisclosureRow> : null}
    <DisclosureRow variant="card" title="Context notes" description="Mark dates you want to remember">
      <label className={styles.check}><input type="checkbox" checked={settings.showAnnotations} onChange={(event) => patch({ showAnnotations: event.target.checked })} />Show context markers on the graph</label>
      <form className={styles.annotationForm} onSubmit={(event) => { event.preventDefault(); addAnnotation(); }}><label>Date<input type="date" required value={annotationDate} onChange={(event) => setAnnotationDate(event.target.value)} /></label><label>Note<input aria-label="Context note" required maxLength={160} placeholder="A change, event, or session" value={annotationLabel} onChange={(event) => setAnnotationLabel(event.target.value)} /></label><button type="submit">Add note</button></form>
      {annotationError ? <p role="alert">{annotationError}</p> : null}
      <p className={styles.subtle}>Context can help you explore a pattern. A shared date does not establish what caused a change.</p>
      <ul className={styles.annotations}>{[...annotations].sort((a, b) => a.date.localeCompare(b.date)).map((annotation) => <li key={annotation.id}><span><time>{annotation.date}</time> · {annotation.label}</span><button type="button" aria-label={`Remove context note: ${annotation.label}`} onClick={() => { try { setAnnotations(writeHistoryAnnotations(annotations.filter((item) => item.id !== annotation.id))); } catch { setAnnotationError('The note could not be removed.'); } }}>Remove</button></li>)}</ul>
    </DisclosureRow>
    <DisclosureRow variant="card" title="How to read this history" description="Scales, gaps, and recorded moments">
      <div className={styles.methods}><p>Valence describes how unpleasant (−5) or pleasant (+5) a moment felt. Arousal describes activation or energy, from very low (−5) to very high (+5). They are separate from the strength of a named feeling. Mixed feelings and Not sure do not become neutral scores.</p><p>The two lines share the same −5 to +5 scale. Older pages may have valence without arousal; those pages remain valid and contribute no arousal point.</p><p>Feeling intensity uses the 1–10 ratings you entered for each feeling. A feeling that was not selected has no intensity measurement. Older labels without a recorded intensity stay visible as unscored pages.</p><p>Feeling frequency counts mentions in the entries that match your filters. Daily percentages use each day’s logged entries as their denominator. No entries means no measurement.</p><p>Periods longer than one day show daily means of available ratings; those averages can conceal variation between entries. Select a day to see the original recorded moments and a written range when ratings varied. Entry-count labels include unrated entries. A one-day view plots those moments separately. Lines connect recorded points in chronological order; they do not estimate ratings between them.</p><p>These are recorded moments, not a continuous measure of your life. More or fewer entries, missing dates, and changing what you choose to write can affect a comparison.</p></div>
    </DisclosureRow>
    {feedback ? <p role="status" className={styles.subtle}>{feedback}</p> : null}
    <OverlayShell open={exportOpen} variant="sheet" title="Print or export history" onClose={() => setExportOpen(false)}>
      <div className={styles.exportBody}><p>{currentDates} · {matching.length} matching entries. The current measure, date range, and filters are included.</p><label className={styles.check}><input type="checkbox" checked={includeText} onChange={(event) => setIncludeText(event.target.checked)} />Include written reflections</label><small>Off by default. Choose what you want to bring to a session or keep for yourself.</small><div className={styles.exportActions}><button type="button" onClick={exportCsv}>Download CSV</button><button type="button" onClick={() => window.print()}>Print graph & recap</button></div><div className={styles.printReport} data-history-print>
        <h2>allneeds · Emotional history</h2><p>{currentDates}</p><p>{settings.metric === 'mood' ? 'Pleasantness & arousal' : settings.metric === 'intensity' ? 'Feeling intensity' : 'Feeling frequency'} · {historyGrouping(settings, range) === 'entry' ? 'Each entry' : 'Daily'}{settings.metric !== 'mood' ? ` · ${settings.feelings.join(', ')}` : ''} · {matching.length} entries · {summary.loggedDays}/{range.days} days with entries</p>
        <HistoryChart printMode series={series} previousSeries={previousSeries} entries={matching} settings={settings} range={range} annotations={annotations} onSelect={() => {}} onSelectDay={() => {}} />
        <p>{settings.metric === 'frequency' ? `${summary.mentioned}/${summary.entries} entries mention ${settings.feelings[0] ?? 'the selected feeling'}.` : settings.metric === 'mood' ? `Median pleasantness ${number(summary.median)} · ${summary.rated} ratings; median arousal ${number(summary.arousalMedian)} · ${summary.arousalRated} ratings.` : `Median ${number(summary.median)} · ${summary.rated} ratings · range ${number(summary.low)} to ${number(summary.high)}.`}</p>
        <p>Filters: {settings.query || 'no text filter'}; feeling {settings.feelingFilter || 'any'}; need {settings.need || 'any'}; tag {settings.tag || 'any'}; intensity {settings.minIntensity}–{settings.maxIntensity}.</p>
        {settings.comparison ? <p>Previous {priorDates}: {priorSummary.entries} entries; {priorSummary.loggedDays}/{range.days} days; {settings.metric === 'frequency' ? `${priorSummary.mentioned}/${priorSummary.entries} mentions.` : settings.metric === 'mood' ? `median pleasantness ${number(priorSummary.median)}; median arousal ${number(priorSummary.arousalMedian)}.` : `median ${number(priorSummary.median)}, ${priorSummary.rated} ratings.`}</p> : null}
        {settings.showAnnotations ? annotations.filter((item) => Date.parse(`${item.date}T12:00:00`) >= range.start && Date.parse(`${item.date}T12:00:00`) < range.end).map((item) => <p key={item.id}>{item.date}: {item.label}</p>) : null}
        <p>Self-reported moments. Missing ratings are not zero; missing days are not neutral. Frequency counts mentions, not proof of absence.</p>
        {includeText ? matching.map((entry) => <article key={entry.id}><h3>{formatJournalDate(journalDate(entry))}</h3><p className={styles.printReflection}>{entry.notes}</p></article>) : null}
      </div></div>
    </OverlayShell>
  </section>;
}
