import { useState } from 'react';

import { OverlayShell } from '../../components/overlays/OverlayShell';
import { downloadBrowserBackup } from '../../persistence/browserBackup';
import { combineReviewedProfile, dismissProfileReview, isInstalledHomeScreenApp, loadProfileIntoCurrentBrowser, resumeHomeScreenSignIn, saveCurrentBrowserToProfile, useProfileReview } from './blueskyAccount';
import type { SettingsSource } from './profileReconciliation';
import styles from './ProfileReview.module.css';

function entryDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function ProfileReview() {
  const review = useProfileReview();
  const deviceLabel = isInstalledHomeScreenApp() ? 'home-screen app' : 'browser';
  const [settings, setSettings] = useState<SettingsSource>('device');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [handoffCode, setHandoffCode] = useState('');
  const close = () => {
    if (busy) return;
    const applied = review?.phase === 'done' && review.combined;
    dismissProfileReview();
    setMessage('');
    setSaved(false);
    setHandoffCode('');
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
  const title = review?.phase === 'done'
    ? 'Combined data'
    : review?.phase === 'handoff-return'
      ? 'Return to the home-screen app'
      : review?.phase === 'handoff-loading' || review?.phase === 'handoff-waiting'
        ? 'Finishing sign-in'
        : review?.phase === 'error' && !review.did
          ? 'Sign-in problem'
        : `Compare ${deviceLabel} with profile`;

  return (
    <OverlayShell open={Boolean(review)} title={title} onClose={close} variant="sheet" closeLabel="Close without changing saved data">
      <div className={styles.content}>
        {review?.phase === 'handoff-return' ? <>
          <p role="status"><strong>Bluesky sign-in finished in Safari.</strong></p>
          <p>Data saved in the home-screen app is separate from Safari. Return to the allneeds icon on your Home Screen now. The app will finish signing in there and compare its data with your saved profile.</p>
          <p className={styles.note}>Do not restore or combine data in Safari for this sign-in.</p>
        </> : null}
        {review?.phase === 'handoff-loading' ? <p role="status">Connecting the verified sign-in to the home-screen app. Its saved data is staying in place.</p> : null}
        {review?.phase === 'handoff-waiting' ? <>
          <p role="status">{review.message}</p>
          <form className={styles.codeForm} onSubmit={(event) => {
            event.preventDefault();
            void run(() => resumeHomeScreenSignIn(handoffCode));
          }}>
            <label htmlFor="home-screen-sign-in-code">Safari confirmation code</label>
            <input id="home-screen-sign-in-code" value={handoffCode} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" placeholder="123 456" onChange={(event) => setHandoffCode(event.target.value.replace(/[^0-9 ]/gu, '').slice(0, 7))} />
            <button type="submit" className={styles.primary} disabled={busy || handoffCode.replace(/\s+/gu, '').length !== 6}>Finish sign-in</button>
          </form>
        </> : null}
        {review?.phase === 'loading' ? <p role="status">Checking your saved profile. Data in this {deviceLabel} stays in place while we compare.</p> : null}
        {review?.phase === 'error' ? <><p role="alert">{review.message}</p>{review.did ? <button type="button" disabled={busy} onClick={() => void run(loadProfileIntoCurrentBrowser)}>Try again</button> : <p>Close this review to sign in again from Account &amp; data.</p>}</> : null}
        {comparison ? <>
          <p>We found differences between this {deviceLabel} and your saved profile. <strong>Nothing has changed yet.</strong></p>
          <table className={styles.summary}>
            <caption>Journal and strategies</caption>
            <thead><tr><th scope="col">Data</th><th scope="col">Only in {deviceLabel}</th><th scope="col">Only in profile</th><th scope="col">Changed copies</th></tr></thead>
            <tbody>
              <tr><th scope="row">Journal</th><td>{comparison.journal.deviceOnly.length}</td><td>{comparison.journal.profileOnly.length}</td><td>{comparison.journal.conflicts.length}</td></tr>
              <tr><th scope="row">Strategies</th><td>{comparison.inventory.deviceOnly.length}</td><td>{comparison.inventory.profileOnly.length}</td><td>{comparison.inventory.conflicts.length}</td></tr>
            </tbody>
          </table>
          <p className={styles.note}>Combining keeps both lists. Unchanged entries stay as one copy; if the same entry was edited differently, both versions are kept.</p>
          {(comparison.journal.deviceOnly.length || comparison.journal.profileOnly.length || comparison.journal.conflicts.length) ? <details className={styles.entries}>
            <summary>Review journal differences</summary>
            {comparison.journal.deviceOnly.map((entry) => <article key={`device-${entry.id}`}><strong>Only in this {deviceLabel}</strong><time dateTime={entry.dateISO}>{entryDate(entry.dateISO)}</time><p>{entry.notes || entry.emotion || 'Journal entry'}</p></article>)}
            {comparison.journal.profileOnly.map((entry) => <article key={`profile-${entry.id}`}><strong>Only in saved profile</strong><time dateTime={entry.dateISO}>{entryDate(entry.dateISO)}</time><p>{entry.notes || entry.emotion || 'Journal entry'}</p></article>)}
            {comparison.journal.conflicts.map((pair) => <article key={pair.device.id}><strong>Changed entry · both versions will be kept</strong><time dateTime={pair.device.dateISO}>{entryDate(pair.device.dateISO)}</time><h3>This {deviceLabel}</h3><p>{pair.device.notes || pair.device.emotion}</p><h3>Saved profile</h3><p>{pair.profile.notes || pair.profile.emotion}</p></article>)}
          </details> : null}
          {comparison.inventory.conflicts.length ? <p className={styles.note}>Changed strategy copies from your profile will be kept privately to avoid duplicating their sharing.</p> : null}
          {comparison.settingKeys.length ? <fieldset className={styles.settings}>
            <legend>Appearance and other settings</legend>
            <label><input type="radio" name="profile-settings" checked={settings === 'device'} onChange={() => setSettings('device')} /> Keep this {deviceLabel}’s settings</label>
            <label><input type="radio" name="profile-settings" checked={settings === 'profile'} onChange={() => setSettings('profile')} /> Use saved profile settings</label>
            <p className={styles.note}>This choice affects appearance and navigation, not which journal entries are kept. Drafts in this {deviceLabel} stay here.</p>
          </fieldset> : null}
          <div className={`${styles.actions} ${styles.commitActions}`}>
            <button type="button" className={styles.primary} disabled={busy} onClick={() => void run(() => combineReviewedProfile(settings))}>Combine {deviceLabel} + profile</button>
            <button type="button" disabled={busy} onClick={close}>Cancel — change nothing</button>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={() => downloadBrowserBackup(comparison.device, 'allneeds-device-before-combining')}>Download {deviceLabel} backup</button>
            <button type="button" onClick={() => downloadBrowserBackup(comparison.profile, 'allneeds-saved-profile-before-combining')}>Download saved-profile backup</button>
          </div>
        </> : null}
        {review?.phase === 'done' ? <>
          <p role="status">{review.message}</p>
          <p className={styles.note}>The combined journal is now saved in this {deviceLabel}. Backing it up to your profile is a separate action.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={busy || saved} onClick={() => void run(async () => {
              const result = await saveCurrentBrowserToProfile();
              setSaved(true);
              setMessage(result.strategiesSynced ? 'Saved to your profile.' : 'Saved to your profile. Shared strategy sync did not finish.');
            })}>{busy ? 'Saving…' : saved ? 'Saved to profile' : `Save ${deviceLabel} to profile`}</button>
            <button type="button" disabled={busy} onClick={close}>Continue</button>
          </div>
        </> : null}
        {review?.phase === 'error' ? <button type="button" onClick={() => downloadBrowserBackup()}>Download device backup</button> : null}
        {message ? <><p role={saved ? 'status' : 'alert'}>{message}</p>{comparison ? <button type="button" disabled={busy} onClick={() => void run(loadProfileIntoCurrentBrowser)}>Review again</button> : null}</> : null}
      </div>
    </OverlayShell>
  );
}
