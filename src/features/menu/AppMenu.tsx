import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { useDialogFocus } from '../../app/useDialogFocus';
import {
  loadProfileIntoCurrentBrowser,
  saveCurrentBrowserToProfile,
  signInWithBluesky,
  signOutFromBluesky,
  useBlueskySession,
} from '../account/blueskyAccount';
import { synchronizeCustomizerMirrors } from '../customizer/customizerSettings';
import { readInventory } from '../inventory/inventoryRepository';
import {
  downloadPersonalStrategiesExport,
  personalStrategiesEmailHref,
  PERSONAL_STRATEGIES_EMAIL_ADDRESS,
  PERSONAL_STRATEGIES_EMAIL_SUBJECT,
} from '../inventory/personalStrategiesExport';
import styles from './AppMenu.module.css';

type MenuView = 'root' | 'account-data';

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

function captureLocalStorage() {
  const snapshot: Record<string, string> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key) snapshot[key] = window.localStorage.getItem(key) ?? '';
  }
  return snapshot;
}

function downloadBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    inventory: readInventory(),
    localStorage: captureLocalStorage(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nvc-localstorage-backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
  const [status, setStatus] = useState('');
  const [shareEmailReady, setShareEmailReady] = useState(false);
  const [handle, setHandle] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const session = useBlueskySession();
  const importRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialogFocus<HTMLElement>({ open, onClose });

  useEffect(() => {
    if (!open) {
      setView('root');
      setStatus('');
      setShareEmailReady(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => dialogRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
  }, [dialogRef, open, view]);

  if (!open) return null;

  const openJournal = () => {
    onClose();
    void navigate('/inventory/journal?compose=new');
  };

  const openCustomizer = () => {
    onClose();
    window.requestAnimationFrame(onOpenCustomizer);
  };

  const exportAll = () => {
    downloadBackup();
    setStatus('Backup downloaded.');
  };

  const shareStrategiesWithNat = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const result = downloadPersonalStrategiesExport(readInventory());
    if (!result.downloaded) {
      setShareEmailReady(false);
      setStatus('No personal strategies are marked “Share with Nat” yet. Turn that on when adding a strategy or from its ••• menu.');
      return;
    }
    setShareEmailReady(true);
    setStatus(`Personal strategies exported! Email the downloaded file to ${PERSONAL_STRATEGIES_EMAIL_ADDRESS} with the subject “${PERSONAL_STRATEGIES_EMAIL_SUBJECT}”.`);
  };

  const toggleBluesky = async () => {
    setAccountBusy(true);
    setStatus('');
    try {
      if (session) {
        await signOutFromBluesky();
        setStatus('Signed out of Bluesky on this browser.');
      } else {
        setStatus('Opening Bluesky sign-in…');
        await signInWithBluesky(handle);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to use Bluesky sign-in right now.');
    } finally {
      setAccountBusy(false);
    }
  };

  const saveProfile = async () => {
    setAccountBusy(true);
    setStatus('Saving this browser to your profile…');
    try {
      const result = await saveCurrentBrowserToProfile();
      setStatus(`Profile saved.${result.strategiesSynced ? ' Shared strategies synced.' : ' Shared strategies could not be synced.'}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save this browser to your profile.');
    } finally { setAccountBusy(false); }
  };

  const loadProfile = async () => {
    setAccountBusy(true);
    setStatus('Loading your saved profile…');
    try {
      const result = await loadProfileIntoCurrentBrowser();
      if (result === 'empty') setStatus('No saved profile snapshot was found.');
      else if (result === 'canceled') setStatus('Profile load canceled. No changes were made.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load your saved profile.');
    } finally { setAccountBusy(false); }
  };

  const importAll = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const snapshot = parsed && typeof parsed === 'object' && 'localStorage' in parsed
        ? (parsed as { localStorage?: unknown }).localStorage
        : null;
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('Invalid backup');
      if (!window.confirm('Replace this browser’s current allneeds data with the selected backup?')) {
        setStatus('Restore canceled. No changes were made.');
        return;
      }
      const previous = captureLocalStorage();
      try {
        window.localStorage.clear();
        Object.entries(snapshot).forEach(([key, value]) => {
          window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
        synchronizeCustomizerMirrors(snapshot as Record<string, unknown>);
      } catch (error) {
        window.localStorage.clear();
        Object.entries(previous).forEach(([key, value]) => window.localStorage.setItem(key, value));
        throw error;
      }
      setStatus('Backup restored. Reloading this local app…');
      window.setTimeout(() => window.location.reload(), 120);
    } catch {
      setStatus('Restore failed. Choose an allneeds.app JSON backup.');
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
                <MenuLink to="/alexithymia-support" label="Guided check-in" note="Start with what you can notice" pathname={pathname} onClose={onClose} />
              </section>

              <section className={styles.section} aria-labelledby="menu-practice">
                <h3 id="menu-practice">Your practice</h3>
                <MenuLink to="/inventory" label="Strategy inventory" note="Your personal library of what helps" count={inventoryCount} pathname={pathname} onClose={onClose} />
                <button type="button" className={styles.row} onClick={openJournal}>
                  <span className={styles.rowCopy}><span className={styles.rowTitle}>Journal</span><span className={styles.rowNote}>Check in with what is present now</span></span>
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
                  <span className={styles.rowCopy}><span className={styles.rowTitle}>Account &amp; data</span><span className={styles.rowNote}>Stored on this device</span></span>
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
                  {status ? <p className={styles.status} role="status">{status}</p> : null}
                  {shareEmailReady ? <a href={personalStrategiesEmailHref()}>Start an email for me</a> : null}
                </div>
              </section>
            </nav>
          </div>
        ) : (
          <div className={styles.view}>
            <header className={`${styles.header} ${styles.subheader}`}>
              <button type="button" className={styles.back} onClick={() => { setView('root'); setStatus(''); setShareEmailReady(false); }} aria-label="Back to Menu"><span aria-hidden="true">‹</span> Menu</button>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close menu">×</button>
            </header>

            <div className={styles.accountHeading}>
              <p className={styles.eyebrow}>Settings</p>
              <h2>Account &amp; data</h2>
              <p>Your data stays on this device unless you choose to back it up.</p>
            </div>

            <section className={styles.systemSection} aria-labelledby="menu-account">
              <h3 id="menu-account">Account</h3>
              <div className={styles.systemCard}>
                <h4>Bluesky</h4>
                <p>Optional production sign-in can sync a profile snapshot across browsers and devices.</p>
                {session ? <p><strong>{session.handle ? `Signed in as @${session.handle.replace(/^@/, '')}` : 'Signed in with Bluesky'}</strong></p> : <label>Bluesky handle<input type="text" value={handle} placeholder="yourname.bsky.social" autoCapitalize="none" autoCorrect="off" spellCheck="false" onChange={(event) => { setHandle(event.target.value); setStatus(''); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void toggleBluesky(); } }} /></label>}
                <button type="button" disabled={accountBusy || (!session && !handle.trim())} onClick={() => void toggleBluesky()}>{accountBusy ? 'Please wait…' : session ? 'Sign out' : 'Sign in'}</button>
                <small>Your allneeds data remains local unless you choose a profile action.</small>
              </div>
              <div className={styles.systemCard}>
                <h4>Profile snapshot</h4>
                <p>Save this browser’s allneeds data to your profile or load a saved profile here.</p>
                <div className={styles.actionPair}><button type="button" disabled={!session || accountBusy} onClick={() => void saveProfile()}>Save this browser</button><button type="button" disabled={!session || accountBusy} onClick={() => void loadProfile()}>Load saved profile</button></div>
                {!session ? <small>Sign in with Bluesky to enable profile sync.</small> : null}
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
                {status ? <p className={styles.status} role="status">{status}</p> : null}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
