import { useEffect, useRef, useState } from 'react';

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
import { requestProfileAction } from './profileConfirmation';
import styles from './ProfileReview.module.css';

export function ProfileReview() {
  const review = useProfileReview();
  const deviceLabel = isInstalledHomeScreenApp() ? 'home-screen app' : 'browser';
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [handoffCode, setHandoffCode] = useState('');
  const [profileAction, setProfileAction] = useState<'merge' | 'replace' | null>(null);
  const promptedComparison = useRef<object | null>(null);
  const handledCompletion = useRef<object | null>(null);

  const close = () => {
    if (busy) return;
    const changed = (review?.phase === 'done' && review.changed) || review?.phase === 'save-error';
    dismissProfileReview();
    setMessage('');
    setHandoffCode('');
    setProfileAction(null);
    if (changed) window.location.reload();
  };
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage('');
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to finish. Your browser data is still available.'); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (review?.phase !== 'ready' || promptedComparison.current === review.comparison) return;
    promptedComparison.current = review.comparison;

    const action = requestProfileAction(review.comparison, deviceLabel);

    if (!action) {
      dismissProfileReview();
      return;
    }

    setProfileAction(action);
    setBusy(true);
    setMessage('');
    const apply = action === 'merge' ? mergeReviewedProfileIntoAccount : replaceBrowserWithReviewedProfile;
    void apply()
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to finish. Your browser data is still available.'))
      .finally(() => setBusy(false));
  }, [deviceLabel, review]);

  useEffect(() => {
    if (review?.phase !== 'done' || handledCompletion.current === review) return;
    handledCompletion.current = review;
    if (review.changed) {
      window.location.reload();
      return;
    }
    window.alert(review.message);
    dismissProfileReview();
  }, [review]);

  const title = review?.phase === 'handoff-return'
    ? 'Return to the home-screen app'
    : review?.phase === 'handoff-loading' || review?.phase === 'handoff-waiting'
      ? 'Finish sign-in'
      : review?.phase === 'loading'
        ? 'Checking saved profile'
        : review?.phase === 'ready'
          ? message ? 'Couldn’t update saved data' : profileAction === 'merge' ? 'Merging local entries' : 'Loading saved profile'
          : review?.phase === 'save-error'
            ? 'Couldn’t save profile'
            : 'Sign-in problem';

  if (review?.phase === 'ready' && !busy && !message) return null;
  if (review?.phase === 'done') return null;

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

        {review?.phase === 'ready' && busy ? <p role="status">{profileAction === 'merge' ? 'Merging local entries into your profile…' : 'Loading your saved profile…'}</p> : null}

        {review?.phase === 'ready' && message ? <>
          <button type="button" onClick={close}>Close</button>
        </> : null}

        {review?.phase === 'save-error' ? <>
          <p role="alert">{review.message}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={busy} onClick={() => void run(retryMergedProfileSave)}>{busy ? 'Saving…' : 'Try saving again'}</button>
            <button type="button" disabled={busy} onClick={close}>Close</button>
          </div>
        </> : null}

        {message ? <p role="alert">{message}</p> : null}
      </div>
    </OverlayShell>
  );
}
