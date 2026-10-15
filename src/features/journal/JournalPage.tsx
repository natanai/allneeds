import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { DisclosureRow } from '../../components/disclosure/DisclosureRow';
import { OverlayShell } from '../../components/overlays/OverlayShell';
import { downloadBrowserBackup, restoreBrowserBackup } from '../../persistence/browserBackup';
import { clearAlexithymiaDraft, clearJournalDraft, readAlexithymiaDraft, readJournalDraft, writeAlexithymiaDraftAgainst } from '../../persistence/workflowDrafts';
import { readJournalEntryPreference, writeJournalEntryPreference, type JournalEntryPreference } from '../../persistence/journalEntryPreference';
import { useBlueskySession } from '../account/blueskyAccount';
import { CheckInReturn, type CheckInLocationState, checkInVisit, useCheckInReturnContext } from '../alexithymia/checkInNavigation';
import { supportTermIndex } from '../alexithymia/alexithymiaTerms';
import { shapeToJournalMood } from '../alexithymia/shapeCoordinates';
import { createCheckInDraft } from '../alexithymia/checkInDraft';
import { synchronizeCustomizerMirrors } from '../customizer/customizerSettings';
import { HistoryWorkspace } from './HistoryWorkspace';
import { JournalBook } from './JournalBook';
import { JOURNAL_CHANGED_EVENT, JOURNAL_STORAGE_KEY, readJournal, writeJournal, type JournalRecord } from './journalRepository';
import styles from './JournalPage.module.css';

type Feedback = { kind: 'success' | 'error' | 'warning'; message: string } | null;

// A saved Journal entry completes only the check-in it came from; another tab may
// already have started a different check-in while this Journal draft was open.
function clearCompletedAlexithymiaCheckIn(entry: JournalRecord) {
  const context = entry.guidedSupport;
  const current = readAlexithymiaDraft();
  if (!context || !current) return;
  const terms = supportTermIndex(current.customTerms);
  const selected = current.termOrder.map((id) => terms.get(id)).filter((term) => (
    term && (current.decisions[term.id] === 'fits' || current.decisions[term.id] === 'maybe')
  ));
  if (
    (context.checkInId !== undefined && current.checkInId !== context.checkInId)
    || current.observation.trim() !== context.observation
    || current.statement.trim() !== context.statement
    || current.selectedNeeds.length !== entry.needs.length
    || current.selectedNeeds.some((need, index) => need !== entry.needs[index])
    || selected.length !== context.terms.length
    || selected.some((term, index) => term?.label !== context.terms[index]?.label || term?.role !== context.terms[index]?.role
      || (context.terms[index]?.decision !== undefined && current.decisions[term!.id] !== context.terms[index]?.decision))
    || Boolean(current.bodyClear) !== Boolean(context.bodyClear)
    || Boolean(current.noWordYet) !== Boolean(context.noWordYet)
    || JSON.stringify(Object.entries(current.selectedCues).filter(([, value]) => value > 0).sort())
      !== JSON.stringify((context.bodyClues ?? []).map((clue) => [clue.id, clue.intensity]).sort())
    || JSON.stringify(Object.entries(current.shape).sort()) !== JSON.stringify(Object.entries(context.overallRatings ?? {}).sort())
    || JSON.stringify(shapeToJournalMood(current.shape, current.overallMood)) !== JSON.stringify(entry.mood)
  ) return;
  clearAlexithymiaDraft();
}
export function JournalPage() {
  const session = useBlueskySession();
  const { search, key: locationKey } = useLocation();
  const context = useCheckInReturnContext();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const [entries, setEntries] = useState(readJournal);
  const [initialEntryId, setInitialEntryId] = useState(params.get('entry'));
  const [open, setOpen] = useState(() => Boolean(params.get('entry') || params.get('compose') === 'new' || params.get('from') === 'observation' || readJournalDraft() || window.sessionStorage.getItem('allneeds.v2.journal.observationDraft')));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [entryChoice, setEntryChoice] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [entryPreference, setEntryPreference] = useState(readJournalEntryPreference);
  const importRef = useRef<HTMLInputElement>(null);
  const syncedLocation = useRef(locationKey);
  const handledStart = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (syncedLocation.current === locationKey) return;
    syncedLocation.current = locationKey;
    const next = new URLSearchParams(search);
    if (next.get('start') === 'new') return;
    const entryId = next.get('entry');
    setEntryChoice(false);
    setInitialEntryId(entryId);
    setOpen(Boolean(entryId || next.get('compose') === 'new' || next.get('from') === 'observation'));
  }, [search, locationKey]);
  useEffect(() => {
    const refresh = () => setEntries(readJournal());
    const storage = (event: StorageEvent) => { if (event.key === JOURNAL_STORAGE_KEY || event.key === null) refresh(); };
    window.addEventListener(JOURNAL_CHANGED_EVENT, refresh);
    window.addEventListener('storage', storage);
    return () => { window.removeEventListener(JOURNAL_CHANGED_EVENT, refresh); window.removeEventListener('storage', storage); };
  }, []);
  const closeJournal = () => {
    setOpen(false);
    const draft = context ? readAlexithymiaDraft() : null;
    if (context && draft && draft.checkInId === context.id) {
      void navigate('/alexithymia-support', { replace: true, state: { checkIn: {
        visit: checkInVisit, id: context.id, stage: draft.stage, restoreScroll: true,
      } } satisfies CheckInLocationState });
      return;
    }
    const next = new URLSearchParams(search); next.delete('compose'); next.delete('entry'); next.delete('from'); next.delete('start');
    void navigate(`/inventory/journal${next.size ? `?${next}` : ''}`, { replace: true });
  };
  const openNew = () => { setInitialEntryId(null); setOpen(true); void navigate('/inventory/journal?compose=new', { replace: params.get('start') === 'new' }); };
  const startEntry = (method: Exclude<JournalEntryPreference, 'ask'>, remember = false) => {
    try {
      if (remember) { writeJournalEntryPreference(method); setEntryPreference(method); }
      if (method === 'writing') { setEntryChoice(false); openNew(); return; }
      const saved = readAlexithymiaDraft();
      if (saved) {
        // The existing lane owns resume/discard. A new-entry action never clears it.
        void navigate('/alexithymia-support', { replace: params.get('start') === 'new' });
      } else {
        const draft = { ...createCheckInDraft(), stage: 1 };
        writeAlexithymiaDraftAgainst(draft, null);
        void navigate('/alexithymia-support', { replace: params.get('start') === 'new', state: { checkIn: {
          visit: checkInVisit, id: draft.checkInId!, stage: 1,
        } } satisfies CheckInLocationState });
      }
    } catch { setFeedback({ kind: 'error', message: 'The entry could not be opened. Check available device storage and try again.' }); }
  };
  const newEntry = () => {
    if (readJournalDraft()) { openNew(); return; }
    const preference = readJournalEntryPreference();
    setEntryPreference(preference);
    if (preference !== 'ask') startEntry(preference);
    else { setOpen(false); setRememberChoice(false); setEntryChoice(true); }
  };
  const closeEntryChoice = () => {
    setEntryChoice(false);
    if (params.get('start') === 'new') void navigate('/inventory/journal', { replace: true });
  };
  useLayoutEffect(() => {
    if (new URLSearchParams(search).get('start') !== 'new') { handledStart.current = null; return; }
    if (handledStart.current === locationKey) return;
    handledStart.current = locationKey;
    newEntry();
  }, [search, locationKey]);
  const openEntry = (id: string) => { setInitialEntryId(id); setOpen(true); void navigate(`/inventory/journal?entry=${encodeURIComponent(id)}`); };
  const save = (entry: JournalRecord, editing: boolean) => {
    try {
      const current = readJournal();
      if (editing && !current.some((item) => item.id === entry.id)) { setFeedback({ kind: 'error', message: 'This entry was removed elsewhere. Your edit draft is still on this device.' }); return false; }
      setEntries(writeJournal(editing ? current.map((item) => item.id === entry.id ? entry : item) : [...current, entry]));
      if (!editing && entry.guidedSupport) {
        try { clearCompletedAlexithymiaCheckIn(entry); }
        catch { /* The Journal entry was saved; an unfinished check-in can still be cleared manually. */ }
      }
      setFeedback({ kind: 'success', message: editing ? 'Journal entry updated.' : 'Journal entry saved to this device.' });
      if (!editing) closeJournal();
      return true;
    } catch { setFeedback({ kind: 'error', message: 'The entry could not be saved. Keep your draft open and check available device storage.' }); return false; }
  };
  const remove = (entry: JournalRecord) => {
    if (!window.confirm('Remove this journal entry from this device?')) return false;
    try { setEntries(writeJournal(readJournal().filter((item) => item.id !== entry.id))); clearJournalDraft(undefined, entry.id); setFeedback({ kind: 'success', message: 'Journal entry removed.' }); return true; }
    catch { setFeedback({ kind: 'error', message: 'The entry could not be removed. No change was made.' }); return false; }
  };
  const importAll = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try {
      const result = await restoreBrowserBackup(file);
      if (result.status === 'canceled') { setFeedback({ kind: 'warning', message: 'Restore canceled. No changes were made.' }); return; }
      synchronizeCustomizerMirrors(result.snapshot); window.location.reload();
    } catch { setFeedback({ kind: 'error', message: 'Import failed. Choose an allneeds.app backup.' }); }
  };
  return <article className={styles.page}>
    <header className={styles.header}><h1>History</h1><div className={styles.entryActions}>
      <button type="button" className={styles.newEntry} onClick={newEntry} aria-expanded={open || entryChoice} aria-controls={entryChoice ? 'journal-entry-choice' : 'journal-layer'}>New entry</button>
      {entryPreference !== 'ask' ? <button type="button" className={styles.entryAlternative} onClick={() => startEntry(entryPreference === 'check-in' ? 'writing' : 'check-in')}>{entryPreference === 'check-in' ? 'Write directly' : 'Guided check-in'}</button> : null}
    </div></header>
    {feedback ? <p className={`${styles.feedback} ${styles[feedback.kind]}`} role="status">{feedback.message}</p> : null}
    <HistoryWorkspace entries={entries} onOpenEntry={openEntry} />
    <DisclosureRow variant="card" title="New entry preference" description={entryPreference === 'check-in' ? 'Guided check-in · This device' : entryPreference === 'writing' ? 'Direct writing · This device' : 'Choose each time'}>
      <div className={styles.entryPreference}><label htmlFor="journal-entry-start">Start new entries with</label><select id="journal-entry-start" value={entryPreference} onChange={(event) => {
        const value = event.target.value as JournalEntryPreference;
        try { writeJournalEntryPreference(value); setEntryPreference(value); }
        catch { setFeedback({ kind: 'error', message: 'Your starting preference could not be saved on this device.' }); }
      }}><option value="ask">Choose each time</option><option value="check-in">Guided check-in</option><option value="writing">Direct writing</option></select></div>
    </DisclosureRow>
    <DisclosureRow variant="card" title="Backup & restore"><p className={styles.localNote}>Journal entries are saved on this device. {session ? 'Saved entries also back up to your profile automatically when online; Account & data shows the last confirmed backup.' : 'Signed out; your entries stay here when you sign in.'} Export or import your journal, inventory, and customizer settings.</p><div className={styles.backupActions}><button type="button" onClick={() => { downloadBrowserBackup(); setFeedback({ kind: 'success', message: `Exported a backup with ${entries.length} journal entries.` }); }}>Export</button><button type="button" onClick={() => importRef.current?.click()}>Import</button><input ref={importRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={importAll} /></div></DisclosureRow>
    <OverlayShell open={entryChoice} id="journal-entry-choice" variant="dialog" title="New entry" onClose={closeEntryChoice} closeInitialFocus>
      <div className={styles.entryChoices}>
        <p>Start with a guided check-in, or write in your own way.</p>
        <button type="button" className={styles.guidedEntry} onClick={() => startEntry('check-in', rememberChoice)}><strong>Guided check-in</strong><span>Notice body clues, find words, and explore Needs.</span></button>
        <button type="button" className={styles.directEntry} onClick={() => startEntry('writing', rememberChoice)}>Write directly in Journal</button>
        <label className={styles.rememberChoice}><input type="checkbox" checked={rememberChoice} onChange={(event) => setRememberChoice(event.target.checked)} />Use this as my starting preference</label>
        {feedback?.kind === 'error' ? <p role="alert">{feedback.message}</p> : null}
      </div>
    </OverlayShell>
    <OverlayShell open={open} id="journal-layer" variant="fullscreen" title="Journal" onClose={closeJournal} closeLabel="Close full screen journal" bodyClassName={styles.modalBody}>
      <div><CheckInReturn /></div>
      {open ? <JournalBook key={initialEntryId ?? 'new'} entries={entries} initialEntryId={initialEntryId} signedIn={Boolean(session)} onSave={save} onRemove={remove} /> : null}
      {feedback?.kind === 'error' ? <p role="alert" className={styles.feedback}>{feedback.message}</p> : null}
    </OverlayShell>
  </article>;
}
