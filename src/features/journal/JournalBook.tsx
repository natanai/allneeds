import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { NeedCatalogPicker } from '../../components/forms/NeedCatalogPicker';
import { DisclosureRow } from '../../components/disclosure/DisclosureRow';
import { OverlayShell } from '../../components/overlays/OverlayShell';
import { feelings, needsBySlug } from '../../data/catalog';
import { clearJournalDraft, readJournalDraft, writeJournalDraft, type JournalComposerDraft } from '../../persistence/workflowDrafts';
import { createJournalRecord, journalDate, type JournalRecord } from './journalRepository';
import { ValenceArousalField } from './ValenceArousalField';
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
    } : createJournalRecord({ ...data, source: draft.guidedSupport ? 'lane' : 'journal' });
    if (!onSave(record, editing)) return;
    activeRef.current.enabled = false;
    try { clearJournalDraft(undefined, editing ? pageId ?? undefined : undefined); } catch { /* The saved record is durable; retain the draft if its cleanup is blocked. */ }
    setDraft(blank()); setEditing(false);
    // Saving a new page returns to History; saving an edit stays on the saved page.
  };
  const clear = () => { const next = blank(); next.editingId = editing ? pageId : null; setDraft(next); setError(''); setDraftStatus('Saving draft…'); };
  const tags = [...new Set(entries.flatMap((item) => item.tags))].sort();
  const isForm = !pageId || editing;
  const canTurnOlder = Boolean(pages[pageId ? pageIndex + 1 : 0]);
  const canTurnNewer = Boolean(pageId);

  return <div className={styles.book} onKeyDown={(event) => {
    if (!event.altKey || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); older(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); newer(); }
  }}>
    <section ref={paperRef} className={styles.paper} aria-label={isForm ? 'Journal writing page' : 'Saved journal page'}>
      <div className={styles.paperContent} key={`${pageId ?? 'new'}-${editing}`}>
        <header className={styles.paperHeader}><h3>{isForm ? editing ? 'Edit entry' : 'New entry' : entry ? formatJournalDate(journalDate(entry)) : 'Page unavailable'}</h3></header>
        {isForm ? <form onSubmit={save} className={styles.form}>
          <div className={styles.formPages}>
            <section className={styles.reflectionSheet}>
              <label><span>Reflection</span><textarea aria-label="Reflection" data-dialog-initial-focus value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} /></label>
            </section>
            <aside className={styles.sidebar}>
              {error ? <p role="alert" className={styles.error}>{error}</p> : null}
              <DisclosureRow title="Emotional coordinates" description="Optional · valence and arousal">
                <fieldset className={styles.mood}><legend className="visually-hidden">Emotional coordinates</legend><ValenceArousalField mood={draft.mood} onChange={(mood) => patch({ mood })} /></fieldset>
              </DisclosureRow>
              <div className={styles.metadata}>
                <div className={styles.metaRow}><label>Feeling</label><div className={styles.catalogControl}>
                  <button type="button" aria-label="Feeling" aria-expanded={picker} onClick={() => setPicker(!picker)}><span>{draft.feelings?.length ? draft.feelings.map((item) => item.feeling).join(', ') : 'Choose feelings'}</span><i aria-hidden="true" /></button>
                  <OverlayShell open={picker} variant="sheet" title="Feelings" onClose={() => setPicker(false)} bodyClassName={styles.pickerSheetBody}>
                    <div className={styles.pickerSheet}>
                    <p className={styles.pickerInstructions}>Move a slider above zero to include a feeling and record its intensity.</p>
                    <input className={styles.pickerSearch} type="search" aria-label="Search feelings" placeholder="Search feelings" value={feelingSearch} onChange={(event) => setFeelingSearch(event.target.value)} autoComplete="off" />
                    <div className={styles.feelingOptions}>
                      {catalog.filter((item) => item.title.toLowerCase().includes(feelingSearch.toLowerCase().trim())).map((item) => {
                        const rating = draft.feelings?.find((selected) => selected.feeling.toLowerCase() === item.title.toLowerCase());
                        return <label key={item.slug} className={styles.feelingRating} data-selected={Boolean(rating)}><span>{item.title}</span><input type="range" min="0" max="10" step="1" value={rating?.intensity ?? 0} aria-label={`${item.title} intensity; 0 means not selected`} onChange={(event) => {
                          const value = Number(event.target.value);
                          patch({ feelings: [...(draft.feelings ?? []).filter((selected) => selected.feeling.toLowerCase() !== item.title.toLowerCase()), ...(value ? [{ feeling: item.title, intensity: value }] : [])].sort((a, b) => a.feeling.localeCompare(b.feeling)) });
                        }} /><output>{rating?.ratingSource === 'unknown' ? '?' : `${rating?.intensity ?? 0}/10`}</output>{rating?.ratingSource === 'unknown' ? <small className={styles.unknownRating}>Intensity was not recorded. Move the slider to rate it.</small> : null}</label>;
                      })}
                    </div><div className={styles.pickerActions}><button type="button" onClick={() => patch({ feelings: [] })}>Clear</button><button type="button" onClick={() => setPicker(false)}>Done</button></div>
                    </div>
                  </OverlayShell>
                </div></div>
                <div className={styles.metaRow}><label id="journal-needs">Needs</label><div onPointerDown={() => setPicker(false)}><NeedCatalogPicker labelId="journal-needs" selectedNeeds={draft.selectedNeeds} onChange={(selectedNeeds) => patch({ selectedNeeds })} presentation="sheet" /></div></div>
                <div className={styles.metaRow}><label htmlFor="journal-tags">Tags</label><div><input id="journal-tags" list="journal-tag-suggestions" value={draft.tags} onChange={(event) => patch({ tags: event.target.value })} placeholder="Add tags" aria-description="Separate tags with commas" /></div><datalist id="journal-tag-suggestions">{tags.map((tag) => <option key={tag} value={tag} />)}</datalist></div>
              </div>
              <DisclosureRow title="Date & reflection prompts">
                <label className={styles.dateField}>When was this moment?<input type="datetime-local" value={draft.experiencedAt ?? ''} onChange={(event) => patch({ experiencedAt: event.target.value })} /></label>
                <small>Leave blank to use {editing && entry ? 'the original entry date' : 'the time you save'}. The original save time is kept separately.</small>
                <ul className={styles.prompts}><li>What did you notice in your body, thoughts, or emotions?</li><li>What was happening when you noticed it?</li><li>What would be useful to understand, request, or do next?</li></ul>
              </DisclosureRow>
              {editing ? <button type="button" onClick={() => turn(pageId)}>Back to saved page</button> : null}
              <div className={styles.actions}><button type="button" onClick={clear}>Clear</button><button type="submit">Save</button></div>
              <small>Save keeps this entry on this device. {signedIn ? 'Signed in; use Account & data to back up to your profile.' : 'Signed out; export a backup or sign in to back up to your profile.'}</small>
              <p className="visually-hidden" role="status">{draftStatus}</p>
            </aside>
          </div>
        </form> : entry ? <div className={styles.readerPages}>
          <section className={`${styles.reflectionSheet} ${styles.savedSheet}`}><span className={styles.reflectionLabel}>Reflection</span><div className={styles.savedReflection}><p>{entry.notes || 'No written reflection on this page.'}</p>
            {entry.guidedSupport ? <DisclosureRow title="Check-in context">
              {entry.guidedSupport.observation && !entry.notes.includes(entry.guidedSupport.observation) ? <p>Situation: {entry.guidedSupport.observation}</p> : null}
              {entry.guidedSupport.terms.length ? <p>Chosen words: {entry.guidedSupport.terms.map((term) => `${term.label} (${term.role})`).join(' · ')}</p> : null}
              {entry.guidedSupport.noWordYet ? <p>No emotion word felt clear yet.</p> : null}
              {entry.guidedSupport.bodyClues?.length ? <p>Body clues: {entry.guidedSupport.bodyClues.map((clue) => `${clue.label} (${clue.intensity}%)`).join(' · ')}</p> : entry.guidedSupport.bodyClear ? <p>No clear body clues were reported.</p> : null}
              {entry.guidedSupport.overallRatings && Object.keys(entry.guidedSupport.overallRatings).length ? <p>Overall-feeling clues: {Object.entries(entry.guidedSupport.overallRatings).map(([dimension, value]) => `${dimension === 'power' ? 'Ability to influence' : dimension === 'expectedness' ? 'Familiar or surprising' : dimension === 'pleasantness' ? 'Pleasantness' : 'Energy'} ${Math.round(value * 4) + 1}/5`).join(' · ')}</p> : null}
              {entry.guidedSupport.statement && entry.guidedSupport.statement !== entry.notes ? <p>Original check-in statement: {entry.guidedSupport.statement}</p> : null}
            </DisclosureRow> : null}
          </div></section>
          <aside className={styles.sidebar}>
            {entry.mood ? <div className={styles.savedMood}><small>Emotional coordinates</small><strong>{entry.mood.kind === 'rated' ? `Valence ${entry.mood.value > 0 ? '+' : ''}${entry.mood.value}${entry.mood.arousal === undefined ? ' · Arousal not recorded' : ` · Arousal ${entry.mood.arousal > 0 ? '+' : ''}${entry.mood.arousal}`}` : entry.mood.kind === 'mixed' ? 'Mixed feelings' : 'Not sure'}</strong></div> : <small>Emotional coordinates were not recorded.</small>}
            <div className={styles.chips}>{entry.feelings.map((item) => <span key={item.feeling}>{item.feeling} · {item.ratingSource === 'unknown' ? 'intensity not recorded' : `${item.intensity}/10`}</span>)}</div>
            <div className={styles.chips}>{entry.needs.map((slug) => <Link key={slug} to={`/needs/${slug}`}>{needsBySlug.get(slug)?.title ?? slug}</Link>)}{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
            {entry.sensations.length ? <p>Body sensations: {entry.sensations.join(', ')}</p> : null}
            {entry.strategies.length ? <p>Strategies: {entry.strategies.join(', ')}</p> : null}
            <small>Originally saved {formatJournalDate(entry.createdAtISO ?? entry.dateISO)}</small>
            <div className={styles.actions}><button type="button" onClick={startEdit}>Edit entry</button><button type="button" onClick={() => { if (onRemove(entry)) turn(null); }}>Delete entry</button></div>
          </aside>
        </div> : <p>This entry is no longer on this device. Your draft remains on the blank newest page.</p>}
      </div>
    </section>
    {canTurnOlder || canTurnNewer ? <footer className={styles.pageFooter}><nav className={styles.pageNav} aria-label="Journal pages">
      {canTurnOlder ? <button type="button" className={styles.olderTurn} onClick={older} aria-label="Turn to older journal page">←</button> : <span />}
      {canTurnNewer ? <button type="button" className={styles.newerTurn} onClick={newer} aria-label={pageIndex > 0 ? 'Turn to newer journal page' : 'Turn to blank new journal page'}>→</button> : null}
    </nav></footer> : null}
  </div>;
}
