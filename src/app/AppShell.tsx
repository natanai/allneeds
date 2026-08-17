import { type ChangeEvent, type MouseEvent as ReactMouseEvent, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';

import { MagnetBoard } from '../components/magnets/MagnetBoard';
import styles from './AppShell.module.css';

function ScrollAndFocusManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}

function MagnetToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={styles.magnetToggle} data-state={checked ? 'on' : 'off'}>
      <input
        type="checkbox"
        className={styles.magnetToggleInput}
        role="switch"
        checked={checked}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
        aria-label={checked ? 'Disable magnet physics' : 'Enable magnet physics'}
      />
      <span className={styles.magnetToggleTrack} aria-hidden="true">
        <span className={styles.magnetToggleThumb} />
      </span>
      <span className="visually-hidden">{checked ? 'Physics is on' : 'Physics is off'}</span>
    </label>
  );
}

export function AppShell() {
  const [navPlayMode, setNavPlayMode] = useState(false);
  const base = import.meta.env.BASE_URL;

  return (
    <div className={styles.pageWrapper}>
      <ScrollAndFocusManager />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <nav className={styles.siteNav} aria-label="Primary">
        <div className={styles.navBoardWrapper}>
          <MagnetBoard
            className={styles.navBoard}
            playMode={navPlayMode}
            storageKey="site-nav"
            ariaLabel="Primary navigation magnets"
          >
            <NavLink
              to="/"
              end
              data-magnet-id="nav-home"
              className={`${styles.navMagnet} ${styles.navHome}`}
              aria-label="Home"
            >
              <svg className={styles.navIcon} aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                <use href={`${base}icons/nav-sprite.svg#icon-home`} />
              </svg>
              <span className="visually-hidden">Home</span>
            </NavLink>

            <button
              data-magnet-id="nav-customizer"
              type="button"
              className={`${styles.navMagnet} ${styles.navCustomizer}`}
              aria-label="Customizer"
              aria-disabled="true"
              title="Customizer migration in progress"
              onClick={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()}
            >
              <span className={styles.navGlyph} aria-hidden="true">+</span>
              <span className="visually-hidden">Customizer</span>
            </button>

            <Link
              data-magnet-id="nav-journal"
              className={`${styles.navMagnet} ${styles.navJournal}`}
              to="/inventory/journal"
            >
              <span>Journal</span>
            </Link>

            <NavLink
              data-magnet-id="nav-inventory"
              className={`${styles.navMagnet} ${styles.navInventory}`}
              to="/inventory"
            >
              <span>Inventory</span>
            </NavLink>

            <NavLink data-magnet-id="nav-observations" className={styles.navMagnet} to="/observations">
              <span>Observations</span>
            </NavLink>

            <NavLink data-magnet-id="nav-feelings" className={styles.navMagnet} to="/feelings">
              <span>Feelings</span>
            </NavLink>

            <NavLink data-magnet-id="nav-needs" className={styles.navMagnet} to="/needs">
              <span>Needs</span>
            </NavLink>
          </MagnetBoard>
          <MagnetToggle checked={navPlayMode} onChange={setNavPlayMode} />
        </div>
      </nav>

      <div id="main-content" className={styles.routeContent} tabIndex={-1}>
        <Outlet />
      </div>
    </div>
  );
}
