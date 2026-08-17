import { type CSSProperties, type ChangeEvent, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import { feelingsIndex } from '../../data/generated/feelingsIndex';
import styles from './FeelingsPage.module.css';

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

export function FeelingsPage() {
  const [query, setQuery] = useState('');
  const [playMode, setPlayMode] = useState(false);
  const [shuffleVersion, setShuffleVersion] = useState(0);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return feelingsIndex.filter((feeling) => feeling.title.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <ol>
          <li><Link to="/">Home</Link></li>
          <li aria-current="page">Feelings</li>
        </ol>
      </nav>

      <main className={styles.page} role="main">
        <header className={styles.pageHeader}>
          <div className={styles.headerTopline}>
            <h1 className={styles.pageTitle}>Feelings</h1>
            <div className={styles.supportActions}>
              <Link className={styles.supportButton} to="/alexithymia-support">Support</Link>
              <Link className={`${styles.supportButton} ${styles.supportGhost}`} to="/inventory/journal">Journal</Link>
            </div>
          </div>
        </header>

        <section aria-labelledby="feelings-list" className={styles.pillSection}>
          <div className={styles.sectionHeader}>
            <Link
              className={styles.emotionWheelLink}
              to="/feelings/emotions-wheel"
              aria-label="Open interactive emotions wheel"
              title="Open interactive emotions wheel"
            >
              <svg className={styles.emotionWheelIcon} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                <circle cx="50" cy="50" r="46" fill="#ffffff" />
                <path d="M50 50 L50 4 A46 46 0 0 1 89.84 27 Z" fill="#b5df8c" />
                <path d="M50 50 L89.84 27 A46 46 0 0 1 89.84 73 Z" fill="#f4a4be" />
                <path d="M50 50 L89.84 73 A46 46 0 0 1 50 96 Z" fill="#f6c48f" />
                <path d="M50 50 L50 96 A46 46 0 0 1 10.16 73 Z" fill="#b7c1f0" />
                <path d="M50 50 L10.16 73 A46 46 0 0 1 10.16 27 Z" fill="#92dad3" />
                <path d="M50 50 L10.16 27 A46 46 0 0 1 50 4 Z" fill="#ffd8a6" />
                <circle cx="50" cy="50" r="16" fill="#ffffff" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="var(--outline)" strokeWidth="4" />
                <circle cx="50" cy="50" r="16" fill="none" stroke="var(--outline)" strokeWidth="3" />
              </svg>
              <span className="visually-hidden">Open interactive emotions wheel</span>
            </Link>
            <h2 id="feelings-list" className={styles.sectionTitle}>Emotion wheel</h2>
            <Link className={styles.bodyCuesLink} to="/feelings/body-cues">
              <span aria-hidden="true">↗</span><span>Body cues</span>
            </Link>
          </div>

          <div className={styles.search}>
            <div className={styles.searchRow}>
              <label className={styles.searchField}>
                <span className="visually-hidden">Search feelings</span>
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search feelings"
                  autoComplete="off"
                  value={query}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                />
              </label>
              <button
                type="button"
                className={styles.shuffleButton}
                onClick={() => setShuffleVersion((current) => current + 1)}
                aria-label="Shuffle magnets"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
                </svg>
              </button>
            </div>

            {query.trim() ? (
              <div className={styles.searchResults} aria-live="polite">
                {matches.length ? (
                  <div className={styles.searchList}>
                    {matches.map((feeling) => (
                      <Link key={feeling.slug} to={`/feelings/${feeling.slug}`} className={styles.searchResultPill}>
                        {feeling.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className={styles.searchCount}>No matches yet.</p>
                )}
              </div>
            ) : null}
          </div>

          <div className={styles.boardWrapper}>
            <MagnetBoard
              className={styles.feelingsBoard}
              playMode={playMode}
              storageKey="feelings"
              shuffleVersion={shuffleVersion}
              ariaLabel="Feelings magnets"
            >
              {feelingsIndex.map((feeling) => {
                const style = {
                  '--magnet-icon': `url(https://raw.githubusercontent.com/natanai/nvc-app/fbf26ce9b7ef2b5b966c3191c4334389274e184f/icons/feelings/${feeling.slug}.svg)`,
                } as CSSProperties;
                return (
                  <Link
                    key={feeling.slug}
                    className={`${styles.pill} ${feeling.needSatisfaction === 'met' ? styles.met : styles.unmet}`}
                    data-magnet-id={`feelings-${feeling.slug}`}
                    to={`/feelings/${feeling.slug}`}
                    style={style}
                  >
                    <span className={styles.magnetLabel}>{feeling.title}</span>
                  </Link>
                );
              })}
            </MagnetBoard>
            <MagnetToggle checked={playMode} onChange={setPlayMode} />
          </div>
        </section>
      </main>
    </>
  );
}
