import { useState } from 'react';

import { OverlayShell } from '../../components/overlays/OverlayShell';
import {
  dismissProfileReview,
  isInstalledHomeScreenApp,
  loadProfileIntoCurrentBrowser,
  mergeReviewedProfileIntoAccount,
  replaceBrowserWithReviewedProfile,
  resumeHomeScreenSignIn,
  retryMergedProfileSave,
  useProfileReview,
} from './blueskyAccount';
import { localProfileRisk } from './profileReconciliation';
import styles from './ProfileReview.module.css';

function list(parts: string[]) {
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

export function ProfileReview() {
  const review = useProfileReview();
  const deviceLabel = isInstalledHomeScreenApp() ? 'home-screen app' : 'browser';
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [handoffCode, setHandoffCode] = useState('');
  const comparison = review?.phase === 'ready' ? review.comparison : null;
  const risk = comparison ? localProfileRisk(comparison) : null;
  const hasLocalRisk = Boolean(risk && (risk.journalEntries || risk.strategies));

  const close = () => {
    if (busy) return;
    const changed = (review?.phase === 'done' && review.changed) || review?.phase === 'save-error';
    dismissProfileReview();
    setMessage('');
    setHandoffCode('');
    if (changed) window.location.reload();
  };
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage('');
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to finish. Your browser data is still available.'); }
    finally { setBusy(false); }
  };

  const title = review?.phase === 'handoff-return'
    ? 'Return to the home-screen app'
    : review?.phase === 'handoff-loading' || review?.phase === 'handoff-waiting'
      ? 'Finish sign-in'
      : review?.phase === 'loading'
        ? 'Checking saved profile'
        : review?.phase === 'ready'
          ? hasLocalRisk ? 'Local entries found' : 'Load saved profile?'
          : review?.phase === 'save-error'
            ? 'Couldn’t save profile'
            : review?.phase === 'done'
              ? 'Finished'
              : 'Sign-in problem';

  const riskParts = risk ? [
    risk.journalEntries ? `${risk.journalEntries} local journal ${risk.journalEntries === 1 ? 'entry' : 'entries'}` : '',
    risk.strategies ? `${risk.strategies} local saved ${risk.strategies === 1 ? 'strategy' : 'strategies'}` : '',
  ].filter(Boolean) : [];

  return (
    <OverlayShell
      open={Boolean(review)}
      title={title}
      onClose={close}
      variant="alert"
      dialogRole="alertdialog"
      closeLabel="Cancel"
      bodyClassName={styles.compactBody}
    >
      <div className={styles.content}>
        {review?.phase === 'handoff-return' ? <>
          <p><strong>Bluesky sign-in finished in Safari.</strong></p>
          <p>Return to the allneeds icon on your Home Screen. The app will finish signing in there without changing Safari’s data.</p>
        </> : null}

        {review?.phase === 'handoff-loading' ? <p role="status">Connecting the verified sign-in to this app. Your saved data is staying in place.</p> : null}

        {review?.phase === 'handoff-waiting' ? <>
          <p role="status">{review.message}</p>
          <form className={styles.codeForm} onSubmit={(event) => {
            event.preventDefault();
            void run(() => resumeHomeScreenSignIn(handoffCode));
          }}>
            <label htmlFor="home-screen-sign-in-code">Safari confirmation code</label>
            <input id="home-screen-sign-in-code" value={handoffCode} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" placeholder="123 456" onChange={(event) => setHandoffCode(event.target.value.replace(/[^0-9 ]/gu, '').slice(0, 7))} />
            <button type="submit" className={styles.primary} disabled={busy || handoffCode.replace(/\s+/gu, '').length !== 6}>{busy ? 'Finishing…' : 'Finish sign-in'}</button>
          </form>
        </> : null}

        {review?.phase === 'loading' ? <p role="status">Checking the account copy. Nothing in this {deviceLabel} has changed yet.</p> : null}

        {review?.phase === 'error' ? <>
          <p role="alert">{review.message}</p>
          {review.did
            ? <button type="button" className={styles.primary} disabled={busy} onClick={() => void run(loadProfileIntoCurrentBrowser)}>{busy ? 'Checking…' : 'Try again'}</button>
            : <p>Close this warning and start sign-in again from Account &amp; data.</p>}
        </> : null}

        {comparison && hasLocalRisk ? <>
          <p>This {deviceLabel} contains {list(riskParts)} not saved in your profile. Loading your saved profile would remove {(risk?.journalEntries ?? 0) + (risk?.strategies ?? 0) === 1 ? 'it' : 'them'}.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={busy} onClick={() => void run(mergeReviewedProfileIntoAccount)}>{busy ? 'Merging…' : 'Merge into profile'}</button>
            <button type="button" className={styles.destructive} disabled={busy} onClick={() => void run(replaceBrowserWithReviewedProfile)}>Discard local entries</button>
          </div>
        </> : null}

        {comparison && !hasLocalRisk ? <>
          <p>Your saved profile will replace data stored in this {deviceLabel}. Unfinished drafts will stay here.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={busy} onClick={() => void run(replaceBrowserWithReviewedProfile)}>{busy ? 'Loading…' : 'Load profile'}</button>
            <button type="button" disabled={busy} onClick={close}>Cancel</button>
          </div>
        </> : null}

        {review?.phase === 'save-error' ? <>
          <p role="alert">{review.message}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={busy} onClick={() => void run(retryMergedProfileSave)}>{busy ? 'Saving…' : 'Try saving again'}</button>
            <button type="button" disabled={busy} onClick={close}>Close</button>
          </div>
        </> : null}

        {review?.phase === 'done' ? <>
          <p role="status">{review.message}</p>
          <button type="button" className={styles.primary} disabled={busy} onClick={close}>Continue</button>
        </> : null}

        {message ? <p role="alert">{message}</p> : null}
      </div>
    </OverlayShell>
  );
}
