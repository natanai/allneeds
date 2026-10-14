import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { useDialogFocus } from '../../app/useDialogFocus';
import { ALEXITHYMIA_SUPPORT_LABEL } from '../../data/productLanguage';
import { downloadBrowserBackup, restoreBrowserBackup } from '../../persistence/browserBackup';
import {
  loadProfileIntoCurrentBrowser,
  saveCurrentBrowserToProfile,
  signInWithBluesky,
  signOutFromBluesky,
  useBlueskySession,
} from '../account/blueskyAccount';
import { synchronizeCustomizerMirrors } from '../customizer/customizerSettings';
import { readProfileRecovery } from '../account/profileReconciliation';
import { PROFILE_BACKUP_STATUS_CHANGED_EVENT, readProfileBackupView, type ProfileBackupView } from '../account/profileBackupStatus';
import { JOURNAL_CHANGED_EVENT } from '../journal/journalRepository';
import { INVENTORY_CHANGED_EVENT } from '../inventory/inventoryRepository';
import { NAV_SETTINGS_CHANGED_EVENT, THEME_CHANGED_EVENT } from '../customizer/customizerSettings';
import { readInventory } from '../inventory/inventoryRepository';
import {
  downloadPersonalStrategiesExport,
  personalStrategiesEmailHref,
  PERSONAL_STRATEGIES_EMAIL_ADDRESS,
  PERSONAL_STRATEGIES_EMAIL_SUBJECT,
} from '../inventory/personalStrategiesExport';
import styles from './AppMenu.module.css';

type MenuView = 'root' | 'account-data';
type MenuStatusTarget = 'share' | 'account' | 'profile' | 'device';
type MenuStatus = {
  target: MenuStatusTarget;
  message: string;
  tone?: 'error';
};

type AppMenuProps = {
  open: boolean;
  pathname: string;
  inventoryCount: number;
  onClose: () => void;
  onOpenCustomizer: () => void;
};

type MenuLinkProps = {
  to: string;
  label: string;
  pathname: string;
  note?: string;
  count?: number;
  onClose: () => void;
};

function isCurrentPath(pathname: string, to: string) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

function MenuLink({ to, label, note, count, pathname, onClose }: MenuLinkProps) {
  return (
    <Link
      className={`${styles.row} ${isCurrentPath(pathname, to) ? styles.current : ''}`}
      to={to}
      aria-current={isCurrentPath(pathname, to) ? 'page' : undefined}
      onClick={onClose}
    >
      <span className={styles.rowCopy}>
        <span className={styles.rowTitle}>{label}</span>
        {note ? <span className={styles.rowNote}>{note}</span> : null}
      </span>
      {typeof count === 'number' && count > 0 ? <span className={styles.badge}>{count}</span> : null}
    </Link>
  );
}

function StatusNotice({ status, target }: { status: MenuStatus | null; target: MenuStatusTarget }) {
  if (!status || status.target !== target) return null;
  return (
    <p
      className={`${styles.status} ${status.tone === 'error' ? styles.statusError : ''}`}
      role={status.tone === 'error' ? 'alert' : 'status'}
    >
      {status.message}
    </p>
  );
}

function localDateTime(isoTime: string) {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function localTime(isoTime: string) {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return 'just now';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function AppMenu({
  open,
  pathname,
  inventoryCount,
  onClose,
  onOpenCustomizer,
}: AppMenuProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<MenuView>('root');
  const [status, setStatus] = useState<MenuStatus | null>(null);
  const [shareEmailReady, setShareEmailReady] = useState(false);
  const [handle, setHandle] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [backupView, setBackupView] = useState<ProfileBackupView | null>(null);
  const session = useBlueskySession();
  const recovery = open ? readProfileRecovery() : null;
  const importRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialogFocus<HTMLElement>({ open, onClose });

  useEffect(() => {
    if (!open) {
      setView('root');
      setStatus(null);
      setShareEmailReady(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => dialogRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
  }, [dialogRef, open, view]);

  useEffect(() => {
    if (!open || !session?.did) { setBackupView(null); return; }
    const refresh = () => setBackupView(readProfileBackupView(session.did));
    refresh();
    const events = [PROFILE_BACKUP_STATUS_CHANGED_EVENT, JOURNAL_CHANGED_EVENT, INVENTORY_CHANGED_EVENT,
      THEME_CHANGED_EVENT, NAV_SETTINGS_CHANGED_EVENT, 'storage'];
    events.forEach((name) => window.addEventListener(name, refresh));
    return () => events.forEach((name) => window.removeEventListener(name, refresh));
  }, [open, session?.did]);

  if (!open) return null;

  const openJournal = () => {
    onClose();
    void navigate('/inventory/journal?start=new');
  };

  const openCustomizer = () => {
    onClose();
    window.requestAnimationFrame(onOpenCustomizer);
  };

  const exportAll = () => {
    downloadBrowserBackup();
    setStatus({ target: 'device', message: 'Backup downloaded.' });
  };

  const shareStrategiesWithNat = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const result = downloadPersonalStrategiesExport(readInventory());
    if (!result.downloaded) {
      setShareEmailReady(false);
      setStatus({
        target: 'share',
        message: 'No Public personal strategies yet. Set Privacy to Public on any strategy you want included in this export.',
      });
      return;
    }
    setShareEmailReady(true);
    setStatus({
      target: 'share',
      message: `Personal strategies exported! Email the downloaded file to ${PERSONAL_STRATEGIES_EMAIL_ADDRESS} with the subject “${PERSONAL_STRATEGIES_EMAIL_SUBJECT}”.`,
    });
  };

  const toggleBluesky = async () => {
    setAccountBusy(true);
    try {
      if (session) {
        setStatus({ target: 'account', message: 'Signing out…' });
        await signOutFromBluesky();
        setStatus({ target: 'account', message: 'Signed out of Bluesky on this browser.' });
      } else {
        setStatus({ target: 'account', message: 'Checking that Bluesky username…' });
        await signInWithBluesky(handle);
      }
    } catch (error) {
      setStatus({
        target: 'account',
        message: error instanceof Error ? error.message : 'Unable to use Bluesky sign-in right now.',
        tone: 'error',
      });
    } finally {
      setAccountBusy(false);
    }
  };

  const saveProfile = async () => {
    setAccountBusy(true);
    setStatus({ target: 'profile', message: 'Backing up profile…' });
    try {
      const result = await saveCurrentBrowserToProfile((progress) => {
        setStatus({
          target: 'profile',
          message: progress.strategyCount > 0
            ? `Profile backed up at ${localTime(progress.profileSavedAt)}. Checking ${progress.strategyCount} shared ${progress.strategyCount === 1 ? 'strategy' : 'strategies'} for changes…`
            : `Profile saved at ${localTime(progress.profileSavedAt)}. Checking shared strategy changes…`,
        });
      });
      const strategySyncTime = result.strategiesSyncedAt
        ? localTime(result.strategiesSyncedAt)
        : 'just now';
      let message: string;
      if (!result.strategiesSynced) {
        message = `Profile backed up at ${localTime(result.profileSavedAt)}. Shared strategy sync did not finish; try Back up profile again.`;
      } else if (result.strategyCount === 0 && !result.unpublishedStrategyCount) {
        message = `Profile backed up at ${localTime(result.profileSavedAt)}. Shared strategies checked at ${strategySyncTime}; there were no shared strategies to sync.`;
      } else if (result.changedStrategyCount === 0 && !result.unpublishedStrategyCount) {
        message = `Profile backed up at ${localTime(result.profileSavedAt)}. All ${result.strategyCount} shared ${result.strategyCount === 1 ? 'strategy was' : 'strategies were'} already up to date when checked at ${strategySyncTime}.`;
      } else {
        const changes = result.changedStrategyCount ?? result.strategyCount;
        const parts = [
          changes ? `${changes} changed shared ${changes === 1 ? 'strategy' : 'strategies'} updated` : '',
          result.unchangedStrategyCount ? `${result.unchangedStrategyCount} already up to date` : '',
          result.unpublishedStrategyCount ? `${result.unpublishedStrategyCount} removed from sharing` : '',
        ].filter(Boolean);
        message = `Profile backed up at ${localTime(result.profileSavedAt)}. Checked at ${strategySyncTime}: ${parts.join(', ')}.`;
      }
      setStatus({
        target: 'profile',
        message,
      });
    } catch (error) {
      setStatus({
        target: 'profile',
        message: error instanceof Error ? error.message : 'Unable to save this browser to your profile.',
        tone: 'error',
      });
    } finally { setAccountBusy(false); }
  };

  const loadProfile = async () => {
    setAccountBusy(true);
    setStatus({ target: 'profile', message: 'Loading your saved profile…' });
    try {
      const result = await loadProfileIntoCurrentBrowser();
      if (result === 'empty') setStatus({ target: 'profile', message: 'No saved profile snapshot was found.' });
      else if (result === 'canceled') setStatus({ target: 'profile', message: 'Profile load canceled. No changes were made.' });
    } catch (error) {
      setStatus({
        target: 'profile',
        message: error instanceof Error ? error.message : 'Unable to load your saved profile.',
        tone: 'error',
      });
    } finally { setAccountBusy(false); }
  };

  const importAll = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await restoreBrowserBackup(file);
      if (result.status === 'canceled') {
        setStatus({ target: 'device', message: 'Restore canceled. No changes were made.' });
        return;
      }
      synchronizeCustomizerMirrors(result.snapshot);
      setStatus({ target: 'device', message: 'Backup restored. Reloading this local app…' });
      window.setTimeout(() => window.location.reload(), 120);
    } catch {
      setStatus({
        target: 'device',
        message: 'Restore failed. Choose an allneeds.app JSON backup.',
        tone: 'error',
      });
    }
  };

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        ref={dialogRef}
        id="app-menu"
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="allneeds.app menu"
        tabIndex={-1}
      >
        {view === 'root' ? (
          <div className={styles.view}>
            <header className={styles.header}>
              <div><p className={styles.eyebrow}>allneeds.app</p><h2>Menu</h2></div>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close menu" data-dialog-initial-focus>×</button>
            </header>

            <nav aria-label="allneeds.app menu">
              <section className={styles.section} aria-labelledby="menu-explore">
                <h3 id="menu-explore">Explore</h3>
                <MenuLink to="/" label="Home" pathname={pathname} onClose={onClose} />
                <MenuLink to="/observations" label="Observations" pathname={pathname} onClose={onClose} />
                <MenuLink to="/feelings" label="Feelings" pathname={pathname} onClose={onClose} />
                <MenuLink to="/needs" label="Needs" pathname={pathname} onClose={onClose} />
                <MenuLink to="/feelings/body-cues" label="Body cues" pathname={pathname} onClose={onClose} />
                <MenuLink to="/faux-feelings" label="Faux feelings" pathname={pathname} onClose={onClose} />
                <MenuLink to="/alexithymia-support" label={ALEXITHYMIA_SUPPORT_LABEL} note="Start with what you can notice" pathname={pathname} onClose={onClose} />
              </section>

              <section className={styles.section} aria-labelledby="menu-practice">
                <h3 id="menu-practice">Your practice</h3>
                <MenuLink to="/inventory" label="Strategy inventory" note="Your personal library of what helps" count={inventoryCount} pathname={pathname} onClose={onClose} />
                <button type="button" className={styles.row} onClick={openJournal}>
                  <span className={styles.rowCopy}><span className={styles.rowTitle}>New journal entry</span><span className={styles.rowNote}>Check in with what is present now</span></span>
                </button>
                <MenuLink to="/inventory/journal" label="History" pathname={pathname} onClose={onClose} />
              </section>

              <section className={styles.section} aria-labelledby="menu-discover">
                <h3 id="menu-discover">Discover</h3>
                <MenuLink to="/feed" label="Shared strategies" note="Ideas other people have chosen to share" pathname={pathname} onClose={onClose} />
              </section>

              <section className={styles.section} aria-labelledby="menu-settings">
                <h3 id="menu-settings">Settings</h3>
                <button type="button" className={styles.row} onClick={() => setView('account-data')}>
                  <span className={styles.rowCopy}><span className={styles.rowTitle}>Account &amp; data</span><span className={styles.rowNote}>{session ? 'Signed in · journal auto backup enabled' : 'Signed out · data stored on this device'}</span></span>
                  <span className={styles.disclosure} aria-hidden="true">›</span>
                </button>
                <button type="button" className={styles.row} onClick={openCustomizer}>
                  <span className={styles.rowCopy}><span className={styles.rowTitle}>Customize…</span><span className={styles.rowNote}>Appearance and navigation magnets</span></span>
                </button>
              </section>

              <section className={`${styles.section} ${styles.personal}`} aria-labelledby="menu-from-nat">
                <h3 id="menu-from-nat">From Nat</h3>
                <div className={styles.personalCard}>
                  <p>If something you saved feels worth sharing, I’d genuinely love to see it.</p>
                  <a href="/inventory" onClick={shareStrategiesWithNat}>Share your strategies with Nat…</a>
                  <StatusNotice status={status} target="share" />
                  {shareEmailReady ? <a href={personalStrategiesEmailHref()}>Start an email for me</a> : null}
                </div>
              </section>
            </nav>
          </div>
        ) : (
          <div className={styles.view}>
            <header className={`${styles.header} ${styles.subheader}`}>
              <button type="button" className={styles.back} onClick={() => { setView('root'); setStatus(null); setShareEmailReady(false); }} aria-label="Back to Menu"><span aria-hidden="true">‹</span> Menu</button>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close menu">×</button>
            </header>

            <div className={styles.accountHeading}>
              <p className={styles.eyebrow}>Settings</p>
              <h2>Account &amp; data</h2>
              <p>Your data is saved on this device. {session ? 'Saved journal entries also back up automatically when online.' : 'Sign in to back it up to your profile.'}</p>
            </div>

            <section className={styles.systemSection} aria-labelledby="menu-account">
              <h3 id="menu-account">Account</h3>
              <div className={styles.systemCard}>
                <h4>Bluesky</h4>
                <p>Sign in to back up or load saved data across browsers and devices.</p>
                {session ? <p><strong>{session.handle ? `Signed in as @${session.handle.replace(/^@/, '')}` : 'Signed in with Bluesky'}</strong></p> : <label>Bluesky username<input type="text" value={handle} placeholder="yourname.bsky.social" autoCapitalize="none" autoCorrect="off" spellCheck="false" onChange={(event) => { setHandle(event.target.value); setStatus(null); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void toggleBluesky(); } }} /></label>}
                <button type="button" disabled={accountBusy || (!session && !handle.trim())} onClick={() => void toggleBluesky()}>{accountBusy ? (session ? 'Please wait…' : 'Checking username…') : session ? 'Sign out' : 'Sign in'}</button>
                <StatusNotice status={status} target="account" />
                <small>Signing in warns you before replacing local data and offers to merge local entries when needed.</small>
              </div>
              <div className={styles.systemCard}>
                <h4>Profile backup</h4>
                <p>Back up journal entries, personal strategies, and settings to your account. Saved journal entries back up automatically when you're signed in and online.</p>
                <div className={styles.actionPair}><button type="button" disabled={!session || accountBusy} onClick={() => void saveProfile()}>Back up profile</button><button type="button" disabled={!session || accountBusy} onClick={() => void loadProfile()}>Load saved profile</button></div>
                <StatusNotice status={status} target="profile" />
                {session ? backupView?.receipt ? <>
                  <p role="status"><strong>Last backed up: {localDateTime(backupView.receipt.savedAt)}</strong></p>
                  <small>Latest backup: {backupView.receipt.summary}. Includes {backupView.receipt.journalCount} journal {backupView.receipt.journalCount === 1 ? 'entry' : 'entries'}, {backupView.receipt.strategyCount} personal {backupView.receipt.strategyCount === 1 ? 'strategy' : 'strategies'}, and profile settings.</small>
                  {Object.values(backupView.pending).some(Boolean) ? <small role="status">Not yet backed up from this device: {[
                    backupView.pending.journal ? 'journal changes' : '',
                    backupView.pending.inventory ? 'strategy changes' : '',
                    backupView.pending.settings ? 'settings changes' : '',
                  ].filter(Boolean).join(', ')}. Use Back up profile to save everything now.</small> : <small>This device has no newer changes in the tracked profile data.</small>}
                </> : <small role="status">No confirmed backup recorded from this device yet. Choose Back up profile to save your data.</small>
                  : <small>Sign in with Bluesky to enable profile backups.</small>}
              </div>
            </section>

            <section className={styles.systemSection} aria-labelledby="menu-device">
              <h3 id="menu-device">This device</h3>
              <div className={styles.systemCard}>
                <h4>Backup &amp; restore</h4>
                <p>Download a backup file, or restore one to this browser.</p>
                <div className={styles.actionPair}>
                  <button type="button" className={styles.primaryAction} onClick={exportAll}>Download backup</button>
                  <button type="button" onClick={() => importRef.current?.click()}>Restore backup</button>
                  <input ref={importRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={importAll} />
                </div>
                <small>Restoring replaces this browser’s current allneeds data.</small>
                <StatusNotice status={status} target="device" />
              </div>
              {recovery ? <div className={styles.systemCard}>
                <h4>Before the last combine</h4>
                <p>Download either original as a backup if you need to recover something.</p>
                <div className={styles.actionPair}><button type="button" onClick={() => downloadBrowserBackup(recovery.device, 'allneeds-device-before-combining')}>Original device data</button><button type="button" onClick={() => downloadBrowserBackup(recovery.profile, 'allneeds-saved-profile-before-combining')}>Original profile data</button></div>
              </div> : null}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
