import { useEffect } from 'react';
import { JOURNAL_CHANGED_EVENT, JOURNAL_STORAGE_KEY, readJournal } from '../journal/journalRepository';
import { readProfileBackupView } from './profileBackupStatus';
import { saveCurrentBrowserToProfile, useBlueskySession, useProfileReview } from './blueskyAccount';

// This sits above routes so a saved entry can finish backing up after its
// journal sheet closes. Draft keystrokes never start a network request.
export function JournalAutoBackup() {
  const session = useBlueskySession();
  const review = useProfileReview();

  useEffect(() => {
    if (!session?.did || !session.verified || review) return;
    const did = session.did;
    let timeout = 0;
    let busy = false;
    let disposed = false;

    const needsBackup = () => {
      const state = readProfileBackupView(did);
      return state.pending.journal && (Boolean(state.receipt) || readJournal().length > 0);
    };

    const run = async () => {
      if (disposed || busy || !needsBackup() || !navigator.onLine) return;
      busy = true;
      try {
        await saveCurrentBrowserToProfile(undefined, 'journal-auto');
      } catch {
        // The journal remains durable locally. The persistent status continues
        // to report pending changes, and online/focus/next save offers a retry.
      } finally {
        busy = false;
        if (!disposed && needsBackup() && navigator.onLine) {
          // If another entry was written while a save was in flight, send it next.
          // Avoid a retry loop on server failures: only follow a confirmed save.
          // See the completion flag below.
        }
      }
    };

    const schedule = () => {
      if (disposed) return;
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => { void run(); }, 800);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === JOURNAL_STORAGE_KEY) schedule();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule();
    };

    window.addEventListener(JOURNAL_CHANGED_EVENT, schedule);
    window.addEventListener('online', schedule);
    window.addEventListener('focus', schedule);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    // A previous attempt may have been interrupted when the installed app closed.
    if (needsBackup()) schedule();

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      window.removeEventListener(JOURNAL_CHANGED_EVENT, schedule);
      window.removeEventListener('online', schedule);
      window.removeEventListener('focus', schedule);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session?.did, session?.verified, review]);

  return null;
}
