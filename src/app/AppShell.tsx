import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router';

import { MagnetBoard } from '../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../components/magnets/MagnetBoard';
import { CustomizerPanel } from '../features/customizer/CustomizerPanel';
import { ProfileReview } from '../features/account/ProfileReview';
import { useProfileReview } from '../features/account/blueskyAccount';
import { AppMenu } from '../features/menu/AppMenu';
import { UxDiagnostics } from './UxDiagnostics';
import { markAppShellVisualReady } from './bootReadiness';
import { markRouteReady } from './uxMetrics';
import { routePresentation, titleFromSegment } from './routePresentation';
import {
  NAV_SETTINGS_CHANGED_EVENT,
  readNavSettings,
  type NavItemId,
} from '../features/customizer/customizerSettings';
import { INVENTORY_CHANGED_EVENT, readInventory } from '../features/inventory/inventoryRepository';
import { readMagnetPlayPreference } from '../persistence/magnetLayoutStore';
import styles from './AppShell.module.css';

function readInventoryCount() {
  return readInventory().length;
}

function JournalMark({ history = false, className }: { history?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 6.5H12c2.2 0 4 1.8 4 4v16c0-2.2-1.8-4-4-4H3.5v-16Z" fill="var(--surface-raised)" />
      <path d="M28.5 6.5H20c-2.2 0-4 1.8-4 4v16c0-2.2 1.8-4 4-4h8.5v-16Z" fill="color-mix(in srgb, var(--action) 32%, var(--surface-raised) 68%)" />
      <path d="M16 10.5v16" stroke="var(--primary)" strokeWidth="2.6" />
      <path d="M22.5 6.5v7l2-1.4 2 1.4v-7Z" fill="var(--action)" />
      {history ? <circle cx="25" cy="7" r="5" fill="var(--surface-raised)" /> : null}
      {history ? <path d="M25 4.5V7l2 1.4" /> : null}
    </svg>
  );
}

function InventoryMark({ count }: { count: number }) {
  const displayCount = count > 999 ? '999+' : String(count);
  return (
    <svg viewBox="0 0 46 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 2.5c1.1.8 2.2 1.2 3.5 1.2S13 3.3 14 2.5l-1.3 4H8.3L7 2.5Z" fill="color-mix(in srgb, var(--primary) 16%, var(--surface-raised) 84%)" />
      <path d="M8.5 6.5C6.4 8.8 3.2 12 3 16.9c-.2 3.3 2.6 5 7.5 5s7.7-1.7 7.5-5c-.2-4.9-3.4-8.1-5.5-10.4h-4Z" fill="var(--surface-raised)" />
      <path d="M6.5 6.5h8" />
      <circle cx="33.5" cy="12" r="9" fill="var(--primary)" />
      <text x="33.5" y="15" fill="var(--primary-fg)" stroke="none" textAnchor="middle" fontSize={displayCount.length > 2 ? 6.3 : 8} fontWeight="800">{displayCount}</text>
    </svg>
  );
}

const routeScrollPositions = new Map<string, number>();

function ScrollAndFocusManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    document.title = routePresentation(location.pathname, location.search).documentTitle;
    const top = navigationType === 'POP'
      ? routeScrollPositions.get(location.key) ?? 0
      : 0;
    let restoreFrame = 0;
    let restoreCancelled = false;
    const restoreDeadline = performance.now() + 3_000;
    const stopWatchingForInput = () => {
      window.removeEventListener('wheel', cancelRestore, true);
      window.removeEventListener('touchstart', cancelRestore, true);
      window.removeEventListener('pointerdown', cancelRestore, true);
      window.removeEventListener('keydown', cancelRestore, true);
    };
    function cancelRestore() {
      restoreCancelled = true;
      window.cancelAnimationFrame(restoreFrame);
      stopWatchingForInput();
    }
    const restore = () => {
      if (restoreCancelled) return;
      window.scrollTo({ top, left: 0, behavior: 'auto' });
      if (navigationType === 'POP'
        && Math.abs(window.scrollY - top) > 1
        && performance.now() < restoreDeadline) {
        restoreFrame = window.requestAnimationFrame(restore);
      } else {
        stopWatchingForInput();
      }
    };
    if (navigationType === 'POP' && top > 0) {
      window.addEventListener('wheel', cancelRestore, { capture: true, passive: true });
      window.addEventListener('touchstart', cancelRestore, { capture: true, passive: true });
      window.addEventListener('pointerdown', cancelRestore, true);
      window.addEventListener('keydown', cancelRestore, true);
    }
    restore();
    markRouteReady();
    if (navigationType !== 'POP') {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }

    return () => {
      cancelRestore();
      routeScrollPositions.set(location.key, window.scrollY);
      if (routeScrollPositions.size > 80) {
        const oldest = routeScrollPositions.keys().next().value;
        if (oldest) routeScrollPositions.delete(oldest);
      }
    };
  }, [location.key, location.pathname, location.search, navigationType]);

  return null;
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return null;

  const crumbs = pathname === '/feed'
    ? [{ label: 'Inventory', to: '/inventory' }, { label: 'Shared strategies', to: '/feed' }]
    : segments.map((segment, index) => ({
      label: titleFromSegment(segment),
      to: `/${segments.slice(0, index + 1).join('/')}`,
    }));

  return (
    <nav className={`${styles.breadcrumbs} ${pathname === '/observations' || pathname === '/inventory' ? styles.mobileHiddenBreadcrumb : ''}`} aria-label="Breadcrumb">
      <ol>
        <li><Link to="/">Home</Link></li>
        {crumbs.map((crumb, index) => {
          const current = index === crumbs.length - 1;
          return (
            <li key={crumb.to} aria-current={current ? 'page' : undefined}>
              {current ? (
                <span className={styles.breadcrumbLabel}>
                  {crumb.to === '/inventory/journal' ? <JournalMark className={styles.breadcrumbIcon} /> : null}
                  {crumb.label}
                </span>
              ) : <Link to={crumb.to}>{crumb.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function AppShell() {
  const { pathname, search } = useLocation();
  const presentation = routePresentation(pathname, search);
  const wheelRoute = pathname === '/feelings/emotions-wheel';
  const fullBleedMobile = pathname === '/observations'
    || pathname === '/inventory'
    || pathname === '/feed'
    || pathname === '/feelings/body-cues'
    || pathname === '/alexithymia-support';
  const journalMobile = pathname === '/inventory/journal';
  const journalComposerActive = pathname === '/inventory/journal'
    && new URLSearchParams(search).get('compose') === 'new';
  const [navPlayMode, setNavPlayMode] = useState(() => readMagnetPlayPreference('site-nav'));
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileReview = useProfileReview();
  const [inventoryCount, setInventoryCount] = useState(readInventoryCount);
  const [navSettings, setNavSettings] = useState(readNavSettings);
  const navBoardWrapperRef = useRef<HTMLDivElement>(null);
  const openCustomizer = useCallback(() => setCustomizerOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (profileReview) { setMenuOpen(false); setCustomizerOpen(false); }
  }, [profileReview]);

  useEffect(() => {
    const updateCount = () => setInventoryCount(readInventoryCount());
    window.addEventListener(INVENTORY_CHANGED_EVENT, updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener(INVENTORY_CHANGED_EVENT, updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  useEffect(() => {
    const update = () => setNavSettings(readNavSettings());
    window.addEventListener(NAV_SETTINGS_CHANGED_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(NAV_SETTINGS_CHANGED_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  useLayoutEffect(() => {
    const wrapper = navBoardWrapperRef.current;
    if (!wrapper) return;
    const markWhenReady = () => {
      if (!wrapper.querySelector('[data-ready="true"]')) return false;
      markAppShellVisualReady();
      return true;
    };
    if (markWhenReady()) return;

    const observer = new MutationObserver(() => {
      if (markWhenReady()) observer.disconnect();
    });
    observer.observe(wrapper, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ready'],
    });
    return () => observer.disconnect();
  }, []);

  const navItems = useMemo<MagnetBoardItem[]>(() => {
    const items: Array<MagnetBoardItem & { setting?: NavItemId }> = [
      {
        id: 'nav-menu',
        label: 'Menu',
        onActivate: () => setMenuOpen((current) => !current),
        tone: 'attention',
        kind: 'nav',
        ariaLabel: 'Open menu',
        ariaExpanded: false,
        ariaHasPopup: 'dialog',
        ariaControls: 'app-menu',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        ),
      },
      {
        id: 'nav-home',
        setting: 'home',
        label: 'Home',
        to: '/',
        tone: 'action',
        kind: 'nav',
        ariaLabel: 'Home',
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z" />
          </svg>
        ),
      },
      {
        id: 'nav-customizer',
        setting: 'customizer',
        label: '+',
        onActivate: openCustomizer,
        kind: 'nav',
        ariaLabel: 'Customizer',
      },
      {
        id: 'nav-journal',
        setting: 'journal',
        label: 'Journal',
        to: '/inventory/journal?compose=new',
        tone: 'action',
        kind: 'nav',
        icon: <JournalMark />,
      },
      {
        id: 'nav-inventory',
        setting: 'inventory',
        label: 'Inventory',
        to: '/inventory',
        kind: 'nav',
        icon: <InventoryMark count={inventoryCount} />,
        ariaLabel: `Inventory, ${inventoryCount} ${inventoryCount === 1 ? 'strategy' : 'strategies'}`,
      },
      {
        id: 'nav-observations',
        setting: 'observations',
        label: 'Observations',
        to: '/observations',
        kind: 'nav',
      },
      {
        id: 'nav-faux-feelings',
        setting: 'fauxFeelings',
        label: 'Faux feelings',
        to: '/faux-feelings',
        kind: 'nav',
      },
      {
        id: 'nav-feelings',
        setting: 'feelings',
        label: 'Feelings',
        to: '/feelings',
        kind: 'nav',
      },
      {
        id: 'nav-needs',
        setting: 'needs',
        label: 'Needs',
        to: '/needs',
        kind: 'nav',
      },
      {
        id: 'nav-body-cues',
        setting: 'bodyCues',
        label: 'Body cues',
        to: '/feelings/body-cues',
        kind: 'nav',
      },
      {
        id: 'nav-journal-dashboard',
        setting: 'journalDashboard',
        label: 'Journal history',
        to: '/inventory/journal',
        tone: 'action',
        kind: 'nav',
        icon: <JournalMark history />,
      },
    ];
    return items.filter((item) => !item.setting || navSettings[item.setting]);
  }, [inventoryCount, navSettings, openCustomizer]);

  navItems.forEach((item) => {
    item.active = false;
    switch (item.id) {
      case 'nav-menu':
        item.ariaLabel = menuOpen ? 'Close menu' : 'Open menu';
        item.ariaExpanded = menuOpen;
        break;
      case 'nav-home':
        item.active = pathname === '/';
        break;
      case 'nav-journal':
        item.active = journalComposerActive;
        break;
      case 'nav-inventory':
        item.active = pathname === '/inventory' || pathname === '/feed';
        break;
      case 'nav-observations':
        item.active = pathname.startsWith('/observations');
        break;
      case 'nav-faux-feelings':
        item.active = pathname.startsWith('/faux-feelings');
        break;
      case 'nav-feelings':
        item.active = pathname.startsWith('/feelings');
        break;
      case 'nav-needs':
        item.active = pathname.startsWith('/needs');
        break;
      case 'nav-body-cues':
        item.active = pathname === '/feelings/body-cues';
        break;
      case 'nav-journal-dashboard':
        item.active = pathname === '/inventory/journal' && !journalComposerActive;
        break;
      default:
        break;
    }
  });

  return (
    <div className={`${styles.app} ${fullBleedMobile ? styles.compactMobileFlow : ''} ${wheelRoute ? styles.wheelApp : ''}`}>
      <ScrollAndFocusManager />
      <a className="skip-link" href="#main-content">Skip to content</a>

      <nav className={styles.nav} aria-label="Primary">
        <div ref={navBoardWrapperRef} className={styles.navBoardWrapper}>
          <MagnetBoard
            items={navItems}
            playMode={navPlayMode}
            onPlayModeChange={setNavPlayMode}
            storageKey="site-nav"
            variant="nav"
            ariaLabel="Primary navigation magnets"
          />
        </div>
      </nav>

      <Breadcrumbs />

      <main
        id="main-content"
        className={`${styles.main} ${fullBleedMobile ? styles.fullBleedMobile : ''} ${journalMobile ? styles.journalMobile : ''}`}
        tabIndex={-1}
        aria-label={presentation.label}
      >
        <div key={pathname} className={styles.pageStage}>
          <Outlet />
        </div>
      </main>

      <button
        type="button"
        className={`${styles.customizerButton} ${menuOpen || customizerOpen ? styles.launcherHidden : ''}`}
        onClick={openCustomizer}
        aria-expanded={customizerOpen}
      >
        <span aria-hidden="true">+</span>
        <span className="visually-hidden">Open customizer</span>
      </button>
      <AppMenu
        open={menuOpen}
        pathname={pathname}
        inventoryCount={inventoryCount}
        onClose={closeMenu}
        onOpenCustomizer={openCustomizer}
      />
      {customizerOpen ? <CustomizerPanel onClose={() => setCustomizerOpen(false)} /> : null}
      <UxDiagnostics />
      <ProfileReview />
    </div>
  );
}
