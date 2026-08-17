import { NavLink, Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';

import styles from './AppShell.module.css';

const primaryNavigation = [
  { to: '/', label: 'Home', end: true },
  { to: '/feelings', label: 'Feelings', end: false },
  { to: '/needs', label: 'Needs', end: false },
  { to: '/observations', label: 'Observations', end: false },
] as const;

function ScrollAndFocusManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}

export function AppShell() {
  return (
    <div className={styles.app}>
      <ScrollAndFocusManager />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className={styles.header}>
        <div className={styles.brandRow}>
          <NavLink className={styles.brand} to="/" aria-label="allneeds.app V2 home">
            <span className={styles.brandMark} aria-hidden="true">
              ●
            </span>
            <span>allneeds.app</span>
            <span className={styles.version}>V2</span>
          </NavLink>
        </div>

        <nav className={styles.nav} aria-label="Primary navigation">
          {primaryNavigation.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>Personal reflection data is intended to stay on your device.</p>
      </footer>
    </div>
  );
}
