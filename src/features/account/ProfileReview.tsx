import { useState } from 'react';

import { OverlayShell } from '../../components/overlays/OverlayShell';
import { downloadBrowserBackup } from '../../persistence/browserBackup';
import { combineReviewedProfile, dismissProfileReview, loadProfileIntoCurrentBrowser, saveCurrentBrowserToProfile, useProfileReview } from './blueskyAccount';
import type { SettingsSource } from './profileReconciliation';
import styles from './ProfileReview.module.css';

function entryDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function ProfileReview() {
  const review = useProfileReview();
  const [settings, setSettings] = useState<SettingsSource>('device');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const close = () => {
    if (busy) return;
    const applied = review?.phase === 'done' && review.combined;
    dismissProfileReview();
    setMessage('');
    setSaved(false);
    setSettings('device');
    if (applied) window.location.reload();
  };
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage('');
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to finish. Your original data is still available.'); }
    finally { setBusy(false); }
  };
  const comparison = review?.phase === 'ready' ? review.comparison : null;

  return (
    <OverlayShell open={Boolean(review)} title={review?.phase === 'done' ? 'Your data' : 'Review saved data'} onClose={close} variant="sheet" closeLabel="Keep this device and close review">
      <div className={styles.content}>
        {review?.phase === 'loading' ? <p role="status">Checking your saved profile. Your device data stays in place while we compare.</p> : null}
        {review?.phase === 'error' ? <><p role="alert">{review.message}</p>{review.did ? <button type="button" disabled={busy} onClick={() => void run(loadProfileIntoCurrentBrowser)}>Try again</button> : <p>Close this review to sign in again from Account &amp; data.</p>}</> : null}
        {comparison ? <>
          <p>There are differences between this device and your saved profile. Choose how to bring them together.</p>
          <table className={styles.summary}>
            <caption>Entries to keep</caption>
            <thead><tr><th scope="col">Data</th><th scope="col">Only here</th><th scope="col">Only in profile</th><th scope="col">Changed copies</th></tr></thead>
            <tbody>
              <tr><th scope="row">Journal</th><td>{comparison.journal.deviceOnly.length}</td><td>{comparison.journal.profileOnly.length}</td><td>{comparison.journal.conflicts.length}</td></tr>
              <tr><th scope="row">Strategies</th><td>{comparison.inventory.deviceOnly.length}</td><td>{comparison.inventory.profileOnly.length}</td><td>{comparison.inventory.conflicts.length}</td></tr>
            </tbody>
          </table>
          <p className={styles.note}>Keep entries from both combines both lists. Unchanged entries stay as one copy; changed entries keep both versions.</p>
          {(comparison.journal.deviceOnly.length || comparison.journal.profileOnly.length || comparison.journal.conflicts.length) ? <details className={styles.entries}>
            <summary>Review journal differences</summary>
            {comparison.journal.deviceOnly.map((entry) => <article key={`device-${entry.id}`}><strong>Only on this device</strong><time dateTime={entry.dateISO}>{entryDate(entry.dateISO)}</time><p>{entry.notes || entry.emotion || 'Journal entry'}</p></article>)}
            {comparison.journal.profileOnly.map((entry) => <article key={`profile-${entry.id}`}><strong>Only in saved profile</strong><time dateTime={entry.dateISO}>{entryDate(entry.dateISO)}</time><p>{entry.notes || entry.emotion || 'Journal entry'}</p></article>)}
            {comparison.journal.conflicts.map((pair) => <article key={pair.device.id}><strong>Changed entry · both versions will be kept</strong><time dateTime={pair.device.dateISO}>{entryDate(pair.device.dateISO)}</time><h3>This device</h3><p>{pair.device.notes || pair.device.emotion}</p><h3>Saved profile</h3><p>{pair.profile.notes || pair.profile.emotion}</p></article>)}
          </details> : null}
          {comparison.inventory.conflicts.length ? <p className={styles.note}>Changed strategy copies from your profile will be kept privately to avoid duplicating their sharing.</p> : null}
          {comparison.settingKeys.length ? <fieldset className={styles.settings}>
            <legend>Appearance and other settings</legend>
            <label><input type="radio" name="profile-settings" checked={settings === 'device'} onChange={() => setSettings('device')} /> Keep this device’s settings</label>
            <label><input type="radio" name="profile-settings" checked={settings === 'profile'} onChange={() => setSettings('profile')} /> Use saved profile settings</label>
            <p className={styles.note}>Settings found in only one place are kept. Drafts already on this device stay here.</p>
          </fieldset> : null}
          <div className={`${styles.actions} ${styles.commitActions}`}>
            <button type="button" className={styles.primary} disabled={busy} onClick={() => void run(() => combineReviewedProfile(settings))}>Keep entries from both</button>
            <button type="button" disabled={busy} onClick={close}>Keep this device</button>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={() => downloadBrowserBackup(comparison.device, 'allneeds-device-before-combining')}>Download device backup</button>
            <button type="button" onClick={() => downloadBrowserBackup(comparison.profile, 'allneeds-saved-profile-before-combining')}>Download profile backup</button>
          </div>
        </> : null}
        {review?.phase === 'done' ? <>
          <p role="status">{review.message}</p>
          <p className={styles.note}>Journal entries are saved on this device. Backing up to your profile is a separate action.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={busy || saved} onClick={() => void run(async () => {
              const result = await saveCurrentBrowserToProfile();
              setSaved(true);
              setMessage(result.strategiesSynced ? 'Saved to your profile.' : 'Saved to your profile. Shared strategy sync did not finish.');
            })}>{busy ? 'Saving…' : saved ? 'Saved to profile' : 'Save this device to profile'}</button>
            <button type="button" disabled={busy} onClick={close}>Continue</button>
          </div>
        </> : null}
        {review?.phase === 'error' ? <button type="button" onClick={() => downloadBrowserBackup()}>Download device backup</button> : null}
        {message ? <><p role={saved ? 'status' : 'alert'}>{message}</p>{comparison ? <button type="button" disabled={busy} onClick={() => void run(loadProfileIntoCurrentBrowser)}>Review again</button> : null}</> : null}
      </div>
    </OverlayShell>
  );
}
