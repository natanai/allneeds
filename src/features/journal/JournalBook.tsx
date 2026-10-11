import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, PointerEvent } from 'react';
import { Link } from 'react-router';
import { NeedCatalogPicker } from '../../components/forms/NeedCatalogPicker';
import { DisclosureRow } from '../../components/disclosure/DisclosureRow';
import { feelings, needsBySlug } from '../../data/catalog';
import { clearJournalDraft, readJournalDraft, writeJournalDraft, type JournalComposerDraft } from '../../persistence/workflowDrafts';
import { createJournalRecord, journalDate, type JournalRecord } from './journalRepository';
import styles from './JournalBook.module.css';

const catalog = [...feelings].sort((a, b) => a.title.localeCompare(b.title));
const blank = (): JournalComposerDraft => ({ notes: '', emotion: '', intensity: 5, feelings: [], selectedNeeds: [], tags: '', editingId: null });
export function formatJournalDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
export function localDateTime(value: string) {
  const date = new Date(value);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}
function initialNewDraft() {
  let draft = readJournalDraft() ?? blank();
  // The previous composer used the new-entry key for edits. Move that draft once.
  if (draft.editingId) {
    try { writeJournalDraft(draft, undefined, draft.editingId); clearJournalDraft(); } catch { /* Keep the original draft if storage is full. */ }
    draft = blank();
  }
  if (!draft.feelings?.length && draft.emotion) draft = { ...draft, feelings: draft.emotion.split(/[,|]/).filter(Boolean).map((feeling) => ({ feeling: feeling.trim(), intensity: draft.intensity || 5 })) };
  const observation = window.sessionStorage.getItem('allneeds.v2.journal.observationDraft')?.trim();
  if (observation) {
    const notes = draft.notes.includes(observation) ? draft.notes : [draft.notes, observation].filter(Boolean).join('\n\n');
    draft = { ...draft, notes };
    try { writeJournalDraft(draft); window.sessionStorage.removeItem('allneeds.v2.journal.observationDraft'); } catch { /* Keep the incoming observation available until saving works. */ }
  }
  return draft;
}

type Props = { entries: JournalRecord[]; initialEntryId: string | null; signedIn: boolean; onSave: (entry: JournalRecord, editing: boolean) => boolean; onRemove: (entry: JournalRecord) => boolean };
export function JournalBook({ entries, initialEntryId, signedIn, onSave, onRemove }: Props) {
  const pages = useMemo(() => [...entries].sort((a, b) => journalDate(b).localeCompare(journalDate(a)) || b.id.localeCompare(a.id)), [entries]);
  const [pageId, setPageId] = useState<string | null>(initialEntryId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNewDraft);
  const [picker, setPicker] = useState(false);
  const [feelingSearch, setFeelingSearch] = useState('');
  const [error, setError] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const paperRef = useRef<HTMLElement>(null);
  const activeRef = useRef({ draft, target: null as string | null, enabled: !initialEntryId });
  activeRef.current = { draft, target: editing ? pageId : null, enabled: !pageId || editing };
  const entry = pages.find((item) => item.id === pageId);
  const pageIndex = pages.findIndex((item) => item.id === pageId);

  const flush = () => {
    const active = activeRef.current;
    if (!active.enabled) return;
    try { writeJournalDraft(active.draft, undefined, active.target ?? undefined); setDraftStatus('Draft saved on this device'); }
    catch { setDraftStatus('Draft could not be saved. Keep this page open or save your entry.'); }
  };
  useEffect(() => {
    if (pageId && !editing) return;
    const timer = window.setTimeout(flush, 180);
    return () => window.clearTimeout(timer);
  }, [draft, editing, pageId]);
  useEffect(() => {
    const hide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', hide);
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', hide); };
  }, []);
  useEffect(() => { paperRef.current?.scrollTo({ top: 0 }); }, [pageId, editing]);

  const patch = (change: Partial<JournalComposerDraft>) => { setDraft((current) => ({ ...current, ...change })); setError(''); setDraftStatus('Saving draft…'); };
  const turn = (id: string | null) => {
    flush(); setPageId(id); setEditing(false); setPicker(false); setError('');
    if (!id) setDraft(readJournalDraft() ?? blank());
  };
  const older = () => { if (pages[pageId ? pageIndex + 1 : 0]) turn(pages[pageId ? pageIndex + 1 : 0]!.id); };
  const newer = () => { if (!pageId) return; turn(pageIndex > 0 ? pages[pageIndex - 1]!.id : null); };
  const startEdit = () => {
    if (!entry) return;
    setDraft(readJournalDraft(undefined, entry.id) ?? {
      notes: entry.notes, emotion: entry.emotion, intensity: entry.intensity ?? 5, feelings: entry.feelings,
      selectedNeeds: entry.needs, tags: entry.tags.join(', '), editingId: entry.id, mood: entry.mood,
      experiencedAt: entry.experiencedAtISO ? localDateTime(entry.experiencedAtISO) : '', guidedSupport: entry.guidedSupport,
    });
    setEditing(true); setError('');
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.notes.trim() && !draft.feelings?.length && !draft.selectedNeeds.length && !draft.mood) { setError('Add a reflection, feeling, related need, or mood before saving.'); return; }
    if (draft.experiencedAt && !Number.isFinite(Date.parse(draft.experiencedAt))) { setError('Choose a valid date and time for this moment.'); return; }
    const experiencedAtISO = draft.experiencedAt ? new Date(draft.experiencedAt).toISOString() : undefined;
    if (experiencedAtISO && localDateTime(experiencedAtISO) !== draft.experiencedAt?.slice(0, 16)) { setError('That local time is unavailable because the clocks changed. Choose another time.'); return; }
    const data = {
      notes: draft.notes, feelings: draft.feelings ?? [], needs: draft.selectedNeeds,
      tags: [...new Set(draft.tags.split(',').map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean))],
      guidedSupport: draft.guidedSupport, mood: draft.mood, experiencedAtISO,
    };
    if (editing && !entry) { setError('This entry is no longer here. Your edit draft is still saved on this device.'); return; }
    const record = editing && entry ? {
      ...entry, ...data, notes: data.notes.trim(), emotion: data.feelings.map((item) => item.feeling).join(', '),
      intensity: data.feelings.length ? Math.max(...data.feelings.map((item) => item.intensity)) : undefined,
    } : createJournalRecord(data);
    if (!onSave(record, editing)) return;
    activeRef.current.enabled = false;
    try { clearJournalDraft(undefined, editing ? pageId ?? undefined : undefined); } catch { /* The saved record is durable; retain the draft if its cleanup is blocked. */ }
    setDraft(blank()); setEditing(false);
    // Saving a new page returns to History; saving an edit stays on the saved page.
  };
  const clear = () => { const next = blank(); next.editingId = editing ? pageId : null; setDraft(next); setError(''); setDraftStatus('Saving draft…'); };
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const endSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = touchStart.current; touchStart.current = null;
    if (!start || event.pointerType !== 'touch') return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 2) { if (dx > 0) older(); else newer(); }
  };
  const tags = [...new Set(entries.flatMap((item) => item.tags))].sort();
  const isForm = !pageId || editing;

  return <div className={styles.book} onKeyDown={(event) => {
    if (!event.altKey || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); older(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); newer(); }
  }}>
    <section ref={paperRef} className={styles.paper} aria-label={isForm ? 'Journal writing page' : 'Saved journal page'}>
      <div className={styles.edge} aria-hidden="true" onPointerDown={(event) => { touchStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={endSwipe} onPointerCancel={() => { touchStart.current = null; }} />
      <div className={styles.paperContent} key={`${pageId ?? 'new'}-${editing}`}>
        <header className={styles.paperHeader}><h3>{isForm ? editing ? 'Edit entry' : 'New entry' : entry ? formatJournalDate(journalDate(entry)) : 'Page unavailable'}</h3><span>{isForm ? 'A little space for what is here' : 'Saved · read only'}</span></header>
        {isForm ? <form onSubmit={save} className={styles.spread}>
          <section className={styles.reflection}>
            <label><span className="visually-hidden">Reflection</span><textarea aria-label="Reflection" data-dialog-initial-focus value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} placeholder="What is on your mind?" /></label>
          </section>
          <DisclosureRow className={styles.entryDetails} title="Entry details" description="Mood, feelings, needs, tags and date">
            <aside className={styles.margin}>
              <fieldset className={styles.mood}><legend>Overall mood <small>optional</small></legend>
                <select aria-label="Overall mood" value={draft.mood?.kind === 'rated' ? String(draft.mood.value) : draft.mood?.kind ?? ''} onChange={(event) => {
                  const value = event.target.value;
                  patch({ mood: value === '' ? undefined : value === 'mixed' || value === 'unsure' ? { kind: value } : { kind: 'rated', value: Number(value) } });
                }}>
                  <option value="">Not rated</option>
                  {Array.from({ length: 11 }, (_, i) => i - 5).map((value) => <option key={value} value={value}>{value > 0 ? '+' : ''}{value}{value === -5 ? ' · Very unpleasant' : value === 0 ? ' · Neutral' : value === 5 ? ' · Very pleasant' : ''}</option>)}
                  <option value="mixed">Mixed feelings</option><option value="unsure">Not sure</option>
                </select><small>How pleasant or unpleasant did this moment feel overall? Mixed and Not sure stay separate from neutral.</small>
              </fieldset>
              <div className={styles.metadata}>
                <div className={styles.metaRow}><label>Feeling</label><div className={styles.catalogControl}>
                  <button type="button" aria-label="Feeling" aria-expanded={picker} onClick={() => setPicker(!picker)}>{draft.feelings?.length ? draft.feelings.map((item) => item.feeling).join(', ') : 'Choose feelings'} <span aria-hidden="true">⌄</span></button>
                  {picker ? <div className={styles.picker} role="dialog" aria-label="Choose one or more feelings">
                    <input type="search" aria-label="Search feelings" placeholder="Search feelings" value={feelingSearch} onChange={(event) => setFeelingSearch(event.target.value)} />
                    <div className={styles.feelingOptions}>
                      {catalog.filter((item) => item.title.toLowerCase().includes(feelingSearch.toLowerCase().trim())).map((item) => {
                        const rating = draft.feelings?.find((selected) => selected.feeling.toLowerCase() === item.title.toLowerCase());
                        return <label key={item.slug} className={styles.feelingRating}><span>{item.title}</span><input type="range" min="0" max="10" step="1" value={rating?.intensity ?? 0} aria-label={`${item.title} intensity; 0 means not selected`} onChange={(event) => {
                          const value = Number(event.target.value);
                          patch({ feelings: [...(draft.feelings ?? []).filter((selected) => selected.feeling.toLowerCase() !== item.title.toLowerCase()), ...(value ? [{ feeling: item.title, intensity: value }] : [])].sort((a, b) => a.feeling.localeCompare(b.feeling)) });
                        }} /><output>{rating?.ratingSource === 'unknown' ? '?' : rating?.intensity ?? 0}</output>{rating?.ratingSource === 'unknown' ? <small className={styles.unknownRating}>Intensity was not recorded. Move the slider to rate it.</small> : null}</label>;
                      })}
                    </div><div className={styles.pickerActions}><button type="button" onClick={() => patch({ feelings: [] })}>Clear</button><button type="button" onClick={() => setPicker(false)}>Done</button></div>
                  </div> : null}
                </div></div>
                <div className={styles.metaRow}><label id="journal-needs">Needs</label><div onPointerDown={() => setPicker(false)}><NeedCatalogPicker labelId="journal-needs" selectedNeeds={draft.selectedNeeds} onChange={(selectedNeeds) => patch({ selectedNeeds })} /></div></div>
                <label className={styles.tagField}>Tags<input list="journal-tags" value={draft.tags} onChange={(event) => patch({ tags: event.target.value })} placeholder="work, weekend" /></label>
                <datalist id="journal-tags">{tags.map((tag) => <option key={tag} value={tag} />)}</datalist>
              </div>
              <DisclosureRow title="Date & reflection prompts">
                <label className={styles.dateField}>When was this moment?<input type="datetime-local" value={draft.experiencedAt ?? ''} onChange={(event) => patch({ experiencedAt: event.target.value })} /></label>
                <small>Leave blank to use {editing && entry ? 'the original entry date' : 'the time you save'}. The original save time is kept separately.</small>
                <ul className={styles.prompts}><li>What did you notice in your body, thoughts, or emotions?</li><li>What was happening when you noticed it?</li><li>What would be useful to understand, request, or do next?</li></ul>
              </DisclosureRow>
              {editing ? <button type="button" onClick={() => turn(pageId)}>Back to saved page</button> : null}
              <small>Save keeps this entry on this device. {signedIn ? 'Signed in; use Account & data to back up to your profile.' : 'Signed out; export a backup or sign in to back up to your profile.'}</small>
            </aside>
          </DisclosureRow>
          {error ? <p role="alert" className={styles.error}>{error}</p> : null}
          <div className={styles.entryFooter}><p className={styles.draftStatus} role="status">{draftStatus}</p><div className={styles.actions}><button type="button" onClick={clear}>Clear</button><button type="submit">Save</button></div></div>
        </form> : entry ? <div className={styles.reader}>
          <div className={styles.savedReflection}><p>{entry.notes || 'No written reflection on this page.'}</p>
            {entry.guidedSupport ? <DisclosureRow title="Check-in context"><p>{entry.guidedSupport.observation}</p><p>{entry.guidedSupport.terms.map((term) => `${term.label} (${term.role})`).join(' · ')}</p><p>{entry.guidedSupport.statement}</p></DisclosureRow> : null}
          </div>
          <DisclosureRow className={styles.entryDetails} title="Page details" description="Mood, feelings, needs and saved time">
            <aside className={styles.margin}>
              {entry.mood ? <div className={styles.savedMood}><small>Overall mood</small><strong>{entry.mood.kind === 'rated' ? `${entry.mood.value > 0 ? '+' : ''}${entry.mood.value} / −5 to +5` : entry.mood.kind === 'mixed' ? 'Mixed feelings' : 'Not sure'}</strong></div> : <small>Overall mood was not rated.</small>}
              <div className={styles.chips}>{entry.feelings.map((item) => <span key={item.feeling}>{item.feeling} · {item.ratingSource === 'unknown' ? 'intensity not recorded' : `${item.intensity}/10`}</span>)}</div>
              <div className={styles.chips}>{entry.needs.map((slug) => <Link key={slug} to={`/needs/${slug}`}>{needsBySlug.get(slug)?.title ?? slug}</Link>)}{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              {entry.sensations.length ? <p>Body sensations: {entry.sensations.join(', ')}</p> : null}
              {entry.strategies.length ? <p>Strategies: {entry.strategies.join(', ')}</p> : null}
              <small>Originally saved {formatJournalDate(entry.createdAtISO ?? entry.dateISO)}</small>
              <div className={styles.actions}><button type="button" onClick={startEdit}>Edit entry</button><button type="button" onClick={() => { if (onRemove(entry)) turn(null); }}>Delete entry</button></div>
            </aside>
          </DisclosureRow>
        </div> : <p>This entry is no longer on this device. Your drafts are still available under New entry.</p>}
      </div>
    </section>
    <footer className={styles.pageFooter}>
      <nav className={styles.pageNav} aria-label="Journal pages">
        <button type="button" onClick={older} disabled={!pages.length || (Boolean(pageId) && pageIndex >= pages.length - 1)}>← <span className={styles.turnWord}>Older</span></button>
        <details className={styles.pageTools}>
          <summary><span className={styles.pagePosition} aria-live="polite"><strong>{isForm ? editing ? 'Editing saved page' : 'Your next page' : 'Saved page'}</strong><small>{pageId && pageIndex >= 0 ? `${pages.length - pageIndex} of ${pages.length}` : `${pages.length} saved ${pages.length === 1 ? 'page' : 'pages'}`}</small></span></summary>
          <div className={styles.jump}>
            <label>Jump to a date<input type="date" onChange={(event) => {
              if (!event.target.value) return;
              const day = new Date(`${event.target.value}T23:59:59`).getTime();
              const match = pages.find((item) => Date.parse(journalDate(item)) <= day) ?? pages.at(-1);
              if (match) turn(match.id);
            }} /></label><small>Swipe the page edge, use the arrows below, or press Alt + ← / →.</small>
          </div>
        </details>
        <button type="button" onClick={newer} disabled={!pageId}><span className={styles.turnWord}>Newer</span> →</button>
        <button type="button" onClick={() => turn(null)} aria-pressed={!pageId}>New entry</button>
      </nav>
    </footer>
  </div>;
}
