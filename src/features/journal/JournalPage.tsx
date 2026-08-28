import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router';

import { useDialogFocus } from '../../app/useDialogFocus';
import { feelings, needs, needsBySlug } from '../../data/catalog';
import { synchronizeCustomizerMirrors } from '../customizer/customizerSettings';
import {
  clearJournalDraft,
  readJournalDraft,
  writeJournalDraft,
} from '../../persistence/workflowDrafts';
import type { JournalComposerDraft } from '../../persistence/workflowDrafts';
import { readInventory } from '../inventory/inventoryRepository';
import { createJournalRecord, readJournal, writeJournal } from './journalRepository';
import type { JournalFeelingRating, JournalRecord } from './journalRepository';
import { journalHistoryNote } from './journalHistoryNote';
import styles from './JournalPage.module.css';

type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';
type DateRange = 'all' | '7' | '30' | '90';
type Feedback = { kind: 'success' | 'error' | 'warning'; message: string } | null;

const feelingCatalog = [...feelings].sort((left, right) => left.title.localeCompare(right.title));
const needCatalog = [...needs].sort((left, right) => left.title.localeCompare(right.title));

function downloadJson(payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nvc-localstorage-backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function storageSnapshot() {
  const result: Record<string, string> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key) result[key] = window.localStorage.getItem(key) ?? '';
  }
  return result;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? '—';
}

function draftFeelings(draft: JournalComposerDraft | null): JournalFeelingRating[] {
  if (draft?.feelings?.length) return draft.feelings;
  if (!draft?.emotion.trim()) return [];
  return draft.emotion.split(/[,|]/).map((feeling) => ({
    feeling: feeling.trim(),
    intensity: Math.min(10, Math.max(1, Math.round(draft.intensity || 5))),
  })).filter((item) => item.feeling);
}

function collapseRepeatedReflection(value: string) {
  const paragraphs = value.trim().split(/\n\s*\n/);
  if (paragraphs.length > 1 && paragraphs.length % 2 === 0) {
    const middle = paragraphs.length / 2;
    const first = paragraphs.slice(0, middle).join('\n\n');
    const second = paragraphs.slice(middle).join('\n\n');
    if (first === second) return first;
  }
  return value.trim();
}

function recordFeelings(entry: JournalRecord) {
  if (entry.feelings.length) return entry.feelings;
  return entry.emotion ? [{ feeling: entry.emotion, intensity: entry.intensity ?? 5 }] : [];
}

export function JournalPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [savedDraft] = useState(readJournalDraft);
  const [observationDraft] = useState(() => window.sessionStorage.getItem('allneeds.v2.journal.observationDraft') ?? '');
  const savedNotes = collapseRepeatedReflection(savedDraft?.notes ?? '');
  const incomingObservation = observationDraft.trim();
  const observationNotes = incomingObservation
    ? savedNotes.includes(incomingObservation)
      ? savedNotes
      : [savedNotes, incomingObservation].filter(Boolean).join('\n\n')
    : savedDraft?.notes ?? '';
  const startingNewFromObservation = Boolean(observationDraft.trim());
  const searchParams = new URLSearchParams(search);
  const shouldOpen = searchParams.get('compose') === 'new'
    || searchParams.get('from') === 'observation'
    || Boolean(observationDraft)
    || Boolean(savedDraft);

  const [entries, setEntries] = useState<JournalRecord[]>(readJournal);
  const [open, setOpen] = useState(shouldOpen);
  const [notes, setNotes] = useState(observationNotes);
  const [selectedFeelings, setSelectedFeelings] = useState<JournalFeelingRating[]>(
    startingNewFromObservation ? [] : draftFeelings(savedDraft),
  );
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(startingNewFromObservation ? [] : savedDraft?.selectedNeeds ?? []);
  const [tags, setTags] = useState(startingNewFromObservation ? '' : savedDraft?.tags ?? '');
  const [guidedSupport, setGuidedSupport] = useState(startingNewFromObservation ? undefined : savedDraft?.guidedSupport);
  const [editingId, setEditingId] = useState<string | null>(startingNewFromObservation ? null : savedDraft?.editingId ?? null);
  const [feelingPickerOpen, setFeelingPickerOpen] = useState(false);
  const [needsPickerOpen, setNeedsPickerOpen] = useState(false);
  const [feelingSearch, setFeelingSearch] = useState('');
  const [needSearch, setNeedSearch] = useState('');
  const [query, setQuery] = useState('');
  const [feelingFilter, setFeelingFilter] = useState('');
  const [needFilter, setNeedFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const emotion = selectedFeelings.map((item) => item.feeling).join(', ');
  const intensity = selectedFeelings.length ? Math.max(...selectedFeelings.map((item) => item.intensity)) : 5;
  const draftRef = useRef<JournalComposerDraft>({ notes, emotion, intensity, feelings: selectedFeelings, selectedNeeds, tags, editingId, guidedSupport });
  draftRef.current = { notes, emotion, intensity, feelings: selectedFeelings, selectedNeeds, tags, editingId, guidedSupport };

  useEffect(() => {
    if (shouldOpen) setOpen(true);
  }, [shouldOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { writeJournalDraft(draftRef.current); } catch { /* Saving still remains available. */ }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [editingId, guidedSupport, notes, selectedFeelings, selectedNeeds, tags]);

  useEffect(() => {
    const flush = () => {
      try { writeJournalDraft(draftRef.current); } catch { /* Restricted storage contexts remain usable. */ }
    };
    const flushWhenHidden = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, []);

  const filterOptions = useMemo(() => ({
    feelings: [...new Set(entries.flatMap((entry) => recordFeelings(entry).map((item) => item.feeling)))].sort(),
    needs: [...new Set(entries.flatMap((entry) => entry.needs))].sort(),
    tags: [...new Set(entries.flatMap((entry) => entry.tags))].sort(),
  }), [entries]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const cutoff = dateRange === 'all' ? null : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000;
    const result = entries.filter((entry) => {
      const entryFeelings = recordFeelings(entry).map((item) => item.feeling);
      const haystack = [entry.notes, ...entryFeelings, ...entry.needs, ...entry.tags].join(' ').toLocaleLowerCase();
      const matchesFeeling = !feelingFilter || entryFeelings.some((value) => value.toLocaleLowerCase() === feelingFilter.toLocaleLowerCase());
      const matchesNeed = !needFilter || entry.needs.includes(needFilter);
      const matchesTag = !tagFilter || entry.tags.some((value) => value.toLocaleLowerCase() === tagFilter.toLocaleLowerCase());
      const matchesDate = cutoff === null || new Date(entry.dateISO).getTime() >= cutoff;
      return (!normalizedQuery || haystack.includes(normalizedQuery)) && matchesFeeling && matchesNeed && matchesTag && matchesDate;
    });
    return result.sort((left, right) => {
      if (sortOrder === 'oldest') return left.dateISO.localeCompare(right.dateISO);
      if (sortOrder === 'highest') return (right.intensity ?? 0) - (left.intensity ?? 0);
      if (sortOrder === 'lowest') return (left.intensity ?? 0) - (right.intensity ?? 0);
      return right.dateISO.localeCompare(left.dateISO);
    });
  }, [dateRange, entries, feelingFilter, needFilter, query, sortOrder, tagFilter]);

  const resetForm = () => {
    setNotes('');
    setSelectedFeelings([]);
    setSelectedNeeds([]);
    setTags('');
    setGuidedSupport(undefined);
    setEditingId(null);
    setFeelingPickerOpen(false);
    setNeedsPickerOpen(false);
    draftRef.current = { notes: '', emotion: '', intensity: 5, feelings: [], selectedNeeds: [], tags: '', editingId: null };
    try { clearJournalDraft(); } catch { /* The cleared form remains cleared in memory. */ }
    window.sessionStorage.removeItem('allneeds.v2.journal.observationDraft');
  };

  const closeJournal = () => {
    setOpen(false);
    setFeelingPickerOpen(false);
    setNeedsPickerOpen(false);
    if (search) void navigate('/inventory/journal', { replace: true });
  };
  const journalDialogRef = useDialogFocus<HTMLDivElement>({ open, onClose: closeJournal });

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!notes.trim() && !selectedFeelings.length && !selectedNeeds.length) {
      setFeedback({ kind: 'error', message: 'Add a reflection, feeling, or related need before saving.' });
      return;
    }
    const parsedTags = tags.split(',').map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean);
    let next: JournalRecord[];
    if (editingId) {
      next = entries.map((entry) => entry.id === editingId ? {
        ...entry,
        notes: notes.trim(),
        emotion,
        intensity,
        feelings: selectedFeelings,
        needs: selectedNeeds,
        tags: [...new Set(parsedTags)],
        ...(guidedSupport ? { guidedSupport } : {}),
      } : entry);
    } else {
      next = [...entries, createJournalRecord({ notes, feelings: selectedFeelings, needs: selectedNeeds, tags: parsedTags, guidedSupport })];
    }
    setEntries(writeJournal(next));
    setFeedback({ kind: 'success', message: editingId ? 'Journal entry updated.' : 'Journal entry saved to this device.' });
    resetForm();
    setOpen(false);
    if (search) void navigate('/inventory/journal', { replace: true });
  };

  const edit = (entry: JournalRecord) => {
    setEditingId(entry.id);
    setNotes(entry.notes);
    setSelectedFeelings(recordFeelings(entry));
    setSelectedNeeds(entry.needs);
    setTags(entry.tags.join(', '));
    setGuidedSupport(entry.guidedSupport);
    setOpen(true);
  };

  const remove = (entry: JournalRecord) => {
    if (!window.confirm('Remove this journal entry from this device?')) return;
    setEntries(writeJournal(entries.filter((item) => item.id !== entry.id)));
    setFeedback({ kind: 'success', message: 'Journal entry removed.' });
  };

  const setFeelingIntensity = (feeling: string, nextIntensity: number) => {
    setSelectedFeelings((current) => {
      const without = current.filter((item) => item.feeling.toLocaleLowerCase() !== feeling.toLocaleLowerCase());
      if (nextIntensity <= 0) return without;
      return [...without, { feeling, intensity: nextIntensity }]
        .sort((left, right) => left.feeling.localeCompare(right.feeling));
    });
  };

  const toggleNeed = (slug: string) => {
    setSelectedNeeds((current) => current.includes(slug)
      ? current.filter((value) => value !== slug)
      : [...current, slug]);
  };

  const exportAll = () => {
    downloadJson({ version: 1, exportedAt: new Date().toISOString(), inventory: readInventory(), journalEntries: entries, localStorage: storageSnapshot() });
    setFeedback({ kind: 'success', message: `Exported a backup with ${entries.length} journal entries.` });
  };

  const importAll = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const snapshot = parsed && typeof parsed === 'object' && 'localStorage' in parsed
        ? (parsed as { localStorage?: unknown }).localStorage
        : null;
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('Invalid');
      if (!window.confirm('Replace this browser’s current allneeds data with the selected backup?')) return;
      const previous = storageSnapshot();
      try {
        window.localStorage.clear();
        Object.entries(snapshot).forEach(([key, value]) => window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)));
        synchronizeCustomizerMirrors(snapshot as Record<string, unknown>);
      } catch (error) {
        window.localStorage.clear();
        Object.entries(previous).forEach(([key, value]) => window.localStorage.setItem(key, value));
        throw error;
      }
      window.location.reload();
    } catch {
      setFeedback({ kind: 'error', message: 'Import failed. Choose an allneeds.app backup.' });
    }
  };

  const filteredFeelings = feelingCatalog.filter((item) => item.title.toLocaleLowerCase().includes(feelingSearch.trim().toLocaleLowerCase()));
  const filteredNeeds = needCatalog.filter((item) => item.title.toLocaleLowerCase().includes(needSearch.trim().toLocaleLowerCase()));
  const hasFilters = Boolean(query || feelingFilter || needFilter || tagFilter || dateRange !== 'all' || sortOrder !== 'newest');

  const entryForm = (idPrefix: string, initialFocus = false) => (
    <form className={styles.form} onSubmit={save}>
      <div className={styles.formPages}>
        <section className={styles.reflectionSheet}>
          <label><span>Reflection</span><textarea aria-label={initialFocus ? 'Reflection' : 'Fallback reflection'} value={notes} onChange={(event) => setNotes(event.target.value)} {...(initialFocus ? { 'data-dialog-initial-focus': true } : {})} /></label>
        </section>
        <aside className={styles.sidebar}>
          <div className={styles.metaGroup}>
            <div className={styles.metaRow}>
              <label>Feeling</label>
              <div className={styles.catalogControl}>
                <button type="button" aria-label="Feeling" aria-expanded={feelingPickerOpen} onClick={() => { setFeelingPickerOpen((value) => !value); setNeedsPickerOpen(false); }}><span data-placeholder={!selectedFeelings.length}>{selectedFeelings.length ? selectedFeelings.map((item) => item.feeling).join(', ') : 'Choose feelings'}</span><i aria-hidden="true" /></button>
                {feelingPickerOpen ? (
                  <div className={styles.catalogPopover} role="dialog" aria-label="Choose one or more feelings">
                    <div className={styles.catalogToolbar}><input type="search" aria-label="Search feelings" placeholder="Search feelings" value={feelingSearch} onChange={(event) => setFeelingSearch(event.target.value)} /></div>
                    <div className={styles.feelingOptions} role="listbox" aria-multiselectable="true">
                      {filteredFeelings.map((item) => {
                        const value = selectedFeelings.find((rating) => rating.feeling.toLocaleLowerCase() === item.title.toLocaleLowerCase())?.intensity ?? 0;
                        return <div key={item.slug} className={styles.feelingRating} data-selected={value > 0} role="group" aria-label={item.title}><span>{item.title}</span><div><input type="range" min="0" max="10" step="1" value={value} aria-label={`${item.title} intensity; 0 means not selected`} onChange={(event) => setFeelingIntensity(item.title, Number(event.target.value))} /><output aria-live="polite">{value}</output></div></div>;
                      })}
                      {!filteredFeelings.length ? <p>No matches</p> : null}
                    </div>
                    <div className={styles.catalogFooter}><button type="button" onClick={() => setSelectedFeelings([])}>Clear</button><button type="button" onClick={() => setFeelingPickerOpen(false)}>Done</button></div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.metaRow}>
              <label>Needs</label>
              <div className={styles.catalogControl}>
                <button type="button" aria-label="Needs" aria-expanded={needsPickerOpen} onClick={() => { setNeedsPickerOpen((value) => !value); setFeelingPickerOpen(false); }}><span data-placeholder={!selectedNeeds.length}>{selectedNeeds.length ? selectedNeeds.map((slug) => needsBySlug.get(slug)?.title ?? slug).join(', ') : 'Choose needs'}</span><i aria-hidden="true" /></button>
                {needsPickerOpen ? (
                  <div className={styles.catalogPopover} role="dialog" aria-label="Choose one or more needs">
                    <div className={styles.catalogToolbar}><input type="search" aria-label="Search needs" placeholder="Search needs" value={needSearch} onChange={(event) => setNeedSearch(event.target.value)} /></div>
                    <div className={styles.needOptions} role="listbox" aria-multiselectable="true">
                      {filteredNeeds.map((item) => <button key={item.slug} type="button" role="option" aria-selected={selectedNeeds.includes(item.slug)} onClick={() => toggleNeed(item.slug)}><span>{item.title}</span><span aria-hidden="true">{selectedNeeds.includes(item.slug) ? '✓' : ''}</span></button>)}
                      {!filteredNeeds.length ? <p>No matches</p> : null}
                    </div>
                    <div className={styles.catalogFooter}><button type="button" onClick={() => setSelectedNeeds([])}>Clear</button><button type="button" onClick={() => setNeedsPickerOpen(false)}>Done</button></div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.metaRow}>
              <label htmlFor={`${idPrefix}-journal-tags`}>Tags</label>
              <div><input id={`${idPrefix}-journal-tags`} list={`${idPrefix}-journal-tag-suggestions`} type="text" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="work, weekend, boundaries" /></div>
              <datalist id={`${idPrefix}-journal-tag-suggestions`}>{filterOptions.tags.map((tag) => <option key={tag} value={tag} />)}</datalist>
            </div>
          </div>

          <aside className={styles.prompts}><p>Optional reflection prompts</p><ul><li>What did you notice in your body, thoughts, or emotions?</li><li>What was happening when you noticed it?</li><li>What would be useful to understand, request, or do next?</li></ul></aside>
          <div className={styles.formActions}><button type="button" onClick={resetForm}>Clear</button><button type="submit">Save</button></div>
          <p className={styles.localNote}>Reminder: This static site saves data in your browser; clearing local storage removes it, so export backups.</p>
        </aside>
      </div>
    </form>
  );

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <h1>Journal</h1>
        <button type="button" className={styles.newEntry} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="journal-layer">
          <span aria-hidden="true">⛶</span> New entry
        </button>
      </header>

      {feedback ? <p className={`${styles.feedback} ${styles[feedback.kind]}`} role="status">{feedback.message}</p> : null}

      <section className={styles.history} aria-labelledby="history-title">
        <header><h2 id="history-title">History</h2></header>
        {entries.length ? (
          <form className={styles.historyControls} onSubmit={(event) => event.preventDefault()}>
            <label className={styles.historySearch}><span className="visually-hidden">Search journal</span><input type="search" placeholder="Search journal" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <div className={styles.filterGrid} aria-label="Filter journal history">
              {filterOptions.feelings.length ? <label><span>Feeling</span><select aria-label="Feeling" value={feelingFilter} onChange={(event) => setFeelingFilter(event.target.value)}><option value="">Any feeling</option>{filterOptions.feelings.map((value) => <option key={value}>{value}</option>)}</select></label> : null}
              {filterOptions.needs.length ? <label><span>Need</span><select aria-label="Need" value={needFilter} onChange={(event) => setNeedFilter(event.target.value)}><option value="">Any need</option>{filterOptions.needs.map((value) => <option key={value} value={value}>{needsBySlug.get(value)?.title ?? value}</option>)}</select></label> : null}
              {filterOptions.tags.length ? <label><span>Tag</span><select aria-label="Tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}><option value="">Any tag</option>{filterOptions.tags.map((value) => <option key={value}>{value}</option>)}</select></label> : null}
              <label><span>Date</span><select aria-label="Date" value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRange)}><option value="all">Any time</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label>
              <label><span>Sort</span><select aria-label="Sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest">Highest intensity</option><option value="lowest">Lowest intensity</option></select></label>
            </div>
            {hasFilters ? <button type="button" className={styles.clearFilters} onClick={() => { setQuery(''); setFeelingFilter(''); setNeedFilter(''); setTagFilter(''); setDateRange('all'); setSortOrder('newest'); }}>Clear filters</button> : null}
          </form>
        ) : null}

        {!entries.length ? (
          <div className={styles.empty}><strong>No entries yet</strong><span>Save your first entry to start building history and patterns. Filters will appear once there is something to explore.</span></div>
        ) : !filteredEntries.length ? (
          <div className={styles.empty}><strong>No matching entries</strong><span>Try clearing one or more filters.</span></div>
        ) : (
          <div className={styles.entryList}>{filteredEntries.map((entry) => {
            const entryRatings = recordFeelings(entry);
            const note = journalHistoryNote(entry.notes);
            return (
              <article key={entry.id} className={styles.entry}>
                <header><div><h3>{entryRatings.length ? entryRatings.map((item) => `${item.feeling} ${item.intensity}/10`).join(' · ') : 'Reflection'}</h3><time dateTime={entry.dateISO}>{formatDate(entry.dateISO)}</time></div></header>
                {note?.collapsible ? (
                  <details className={styles.noteDisclosure}>
                    <summary><span className={styles.notePreview}>{note.preview}</span><span className={styles.noteToggleClosed}>Read full entry</span><span className={styles.noteToggleOpen}>Show less</span></summary>
                    <p className={styles.noteFull}>{note.full}</p>
                  </details>
                ) : note ? <p>{note.full}</p> : null}
                {entry.needs.length || entry.tags.length ? <div className={styles.chips}>
                  {entry.needs.map((slug) => <Link key={slug} to={`/needs/${slug}`} data-need>{needsBySlug.get(slug)?.title ?? slug}</Link>)}
                  {entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div> : null}
                <footer><button type="button" onClick={() => edit(entry)}>Edit</button><button type="button" onClick={() => remove(entry)}>Delete</button></footer>
              </article>
            );
          })}</div>
        )}
      </section>

      <div className={styles.tools} aria-label="Journal tools">
        <details className={styles.disclosure}>
          <summary><span><strong>Patterns</strong><small>Trends across entries</small></span><span aria-hidden="true">›</span></summary>
          <div className={styles.disclosureBody}>
            {entries.length ? (
              <div className={styles.stats}>
                <article><strong>{entries.length}</strong><span>entries</span></article>
                <article><strong>{Math.round(entries.reduce((sum, entry) => sum + (entry.intensity ?? 0), 0) / entries.length * 10) / 10}</strong><span>average intensity</span></article>
                <article><strong>{mostCommon(entries.flatMap((entry) => recordFeelings(entry).map((item) => item.feeling)))}</strong><span>most noted feeling</span></article>
                <article><strong>{needsBySlug.get(mostCommon(entries.flatMap((entry) => entry.needs)))?.title ?? mostCommon(entries.flatMap((entry) => entry.needs))}</strong><span>most noted need</span></article>
              </div>
            ) : <p><strong>Patterns grow with your journal.</strong><br />Recurring feelings, needs, tags, and intensity trends will appear here as you save entries.</p>}
          </div>
        </details>

        <details className={styles.disclosure}>
          <summary><strong>Backup &amp; restore</strong><span aria-hidden="true">›</span></summary>
          <div className={styles.disclosureBody}>
            <p>Export or import your journal, inventory, and customizer settings.</p>
            <div className={styles.backupActions}><button type="button" onClick={exportAll}>Export</button><button type="button" onClick={() => importRef.current?.click()}>Import</button><input ref={importRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={importAll} /></div>
          </div>
        </details>
      </div>

      <details className={styles.fallbackEditor}>
        <summary><span>Fallback editor</span><span aria-hidden="true">⌄</span></summary>
        <div className={styles.fallbackBody}>
          <p>Use only if New entry does not open.</p>
          <section aria-labelledby="fallback-entry-title">
            <h2 id="fallback-entry-title" className="visually-hidden">{editingId ? 'Edit journal entry' : 'Fallback journal entry editor'}</h2>
            {entryForm('fallback')}
          </section>
        </div>
      </details>

      {open ? createPortal((
        <div ref={journalDialogRef} id="journal-layer" className={styles.modal} role="dialog" aria-modal="true" aria-label="Journal" tabIndex={-1}>
          <header className={styles.modalHeader}><h3>Journal</h3><button type="button" onClick={closeJournal} aria-label="Close full screen journal">×</button></header>
          <div className={styles.modalBody}>
            <section aria-labelledby="new-entry-title">
              <h2 id="new-entry-title">{editingId ? 'Edit entry' : 'New entry'}</h2>
              {entryForm('modal', true)}
            </section>
          </div>
        </div>
      ), document.body) : null}
    </article>
  );
}
