import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { DisclosureRow } from '../../components/disclosure/DisclosureRow';
import { OverlayShell } from '../../components/overlays/OverlayShell';
import { downloadBrowserBackup, restoreBrowserBackup } from '../../persistence/browserBackup';
import { clearJournalDraft, readJournalDraft } from '../../persistence/workflowDrafts';
import { useBlueskySession } from '../account/blueskyAccount';
import { synchronizeCustomizerMirrors } from '../customizer/customizerSettings';
import { HistoryWorkspace } from './HistoryWorkspace';
import { JournalBook } from './JournalBook';
import { JOURNAL_CHANGED_EVENT, JOURNAL_STORAGE_KEY, readJournal, writeJournal, type JournalRecord } from './journalRepository';
import styles from './JournalPage.module.css';

type Feedback = { kind: 'success' | 'error' | 'warning'; message: string } | null;
export function JournalPage() {
  const session = useBlueskySession();
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const [entries, setEntries] = useState(readJournal);
  const [initialEntryId, setInitialEntryId] = useState(params.get('entry'));
  const [open, setOpen] = useState(() => Boolean(params.get('entry') || params.get('compose') === 'new' || params.get('from') === 'observation' || readJournalDraft() || window.sessionStorage.getItem('allneeds.v2.journal.observationDraft')));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const firstSearch = useRef(true);
  useEffect(() => {
    if (firstSearch.current) { firstSearch.current = false; return; }
    const next = new URLSearchParams(search);
    const entryId = next.get('entry');
    setInitialEntryId(entryId);
    setOpen(Boolean(entryId || next.get('compose') === 'new' || next.get('from') === 'observation'));
  }, [search]);
  useEffect(() => {
    const refresh = () => setEntries(readJournal());
    const storage = (event: StorageEvent) => { if (event.key === JOURNAL_STORAGE_KEY || event.key === null) refresh(); };
    window.addEventListener(JOURNAL_CHANGED_EVENT, refresh);
    window.addEventListener('storage', storage);
    return () => { window.removeEventListener(JOURNAL_CHANGED_EVENT, refresh); window.removeEventListener('storage', storage); };
  }, []);
  const closeJournal = () => {
    setOpen(false);
    const next = new URLSearchParams(search); next.delete('compose'); next.delete('entry'); next.delete('from');
    void navigate(`/inventory/journal${next.size ? `?${next}` : ''}`, { replace: true });
  };
  const openNew = () => { setInitialEntryId(null); setOpen(true); void navigate('/inventory/journal?compose=new'); };
  const openEntry = (id: string) => { setInitialEntryId(id); setOpen(true); void navigate(`/inventory/journal?entry=${encodeURIComponent(id)}`); };
  const save = (entry: JournalRecord, editing: boolean) => {
    try {
      const current = readJournal();
      if (editing && !current.some((item) => item.id === entry.id)) { setFeedback({ kind: 'error', message: 'This entry was removed elsewhere. Your edit draft is still on this device.' }); return false; }
      setEntries(writeJournal(editing ? current.map((item) => item.id === entry.id ? entry : item) : [...current, entry]));
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
    <header className={styles.header}><h1>History</h1><button type="button" className={styles.newEntry} onClick={openNew} aria-expanded={open} aria-controls="journal-layer">New entry</button></header>
    <HistoryWorkspace entries={entries} onOpenEntry={openEntry} />
    {feedback ? <p className={`${styles.feedback} ${styles[feedback.kind]}`} role="status">{feedback.message}</p> : null}
    <DisclosureRow variant="card" title="Backup & restore"><p className={styles.localNote}>Journal entries are saved on this device. {session ? 'Signed in; profile backups are separate.' : 'Signed out; your entries stay here when you sign in.'} Export or import your journal, inventory, and customizer settings.</p><div className={styles.backupActions}><button type="button" onClick={() => { downloadBrowserBackup(); setFeedback({ kind: 'success', message: `Exported a backup with ${entries.length} journal entries.` }); }}>Export</button><button type="button" onClick={() => importRef.current?.click()}>Import</button><input ref={importRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={importAll} /></div></DisclosureRow>
    <OverlayShell open={open} id="journal-layer" variant="fullscreen" title="Journal" onClose={closeJournal} closeLabel="Close full screen journal" bodyClassName={styles.modalBody}>
      {open ? <JournalBook key={initialEntryId ?? 'new'} entries={entries} initialEntryId={initialEntryId} signedIn={Boolean(session)} onSave={save} onRemove={remove} /> : null}
      {feedback?.kind === 'error' ? <p role="alert" className={styles.feedback}>{feedback.message}</p> : null}
    </OverlayShell>
  </article>;
}
