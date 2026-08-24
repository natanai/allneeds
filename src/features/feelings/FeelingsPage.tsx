import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import { assetPath, feelings } from '../../data/catalog';
import { readBrowseQuery, writeBrowseQuery } from '../../persistence/browseState';
import { readMagnetPlayPreference } from '../../persistence/magnetLayoutStore';
import styles from './FeelingsPage.module.css';

export function FeelingsPage() {
  const [query, setQueryState] = useState(() => readBrowseQuery('feelings'));
  const [playMode, setPlayMode] = useState(() => readMagnetPlayPreference('/feelings/:0'));
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const setQuery = (value: string) => setQueryState(writeBrowseQuery('feelings', value));

  const visibleFeelings = useMemo(
    () => normalizedQuery
      ? feelings.filter((feeling) => feeling.title.toLocaleLowerCase().includes(normalizedQuery))
      : feelings,
    [normalizedQuery],
  );

  const items = useMemo<MagnetBoardItem[]>(() => visibleFeelings.map((feeling) => ({
    id: `feelings-${feeling.slug}`,
    label: feeling.title,
    to: `/feelings/${feeling.slug}`,
    kind: 'feeling',
    tone: 'sky',
    iconUrl: assetPath(`icons/feelings/${feeling.slug}.svg`),
  })), [visibleFeelings]);

  return (
    <section className={styles.page} aria-labelledby="feelings-title">
      <header className={styles.pageHeader}>
        <div className={styles.topline}>
          <h1 id="feelings-title" className={styles.pageTitle}>Feelings</h1>
          <div className={styles.actions}>
            <Link className={styles.action} to="/alexithymia-support">Support</Link>
            <Link className={`${styles.action} ${styles.actionGhost}`} to="/inventory/journal">Journal</Link>
          </div>
        </div>
      </header>

      <section className={styles.magnetSection} aria-labelledby="feelings-list">
        <div className={styles.sectionHeader}>
          <Link
            className={styles.wheelLink}
            to="/feelings/emotions-wheel"
            aria-label="Open interactive emotions wheel"
            title="Open interactive emotions wheel"
          >
            <svg className={styles.wheelIcon} viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="#fff" />
              <path d="M50 50 L50 4 A46 46 0 0 1 89.84 27 Z" fill="#b5df8c" />
              <path d="M50 50 L89.84 27 A46 46 0 0 1 89.84 73 Z" fill="#f4a4be" />
              <path d="M50 50 L89.84 73 A46 46 0 0 1 50 96 Z" fill="#f6c48f" />
              <path d="M50 50 L50 96 A46 46 0 0 1 10.16 73 Z" fill="#b7c1f0" />
              <path d="M50 50 L10.16 73 A46 46 0 0 1 10.16 27 Z" fill="#92dad3" />
              <path d="M50 50 L10.16 27 A46 46 0 0 1 50 4 Z" fill="#ffd8a6" />
              <circle cx="50" cy="50" r="16" fill="#fff" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <span className="visually-hidden">Open interactive emotions wheel</span>
          </Link>
          <h2 id="feelings-list" className={styles.sectionTitle}>Emotion wheel</h2>
          <Link className={styles.altLink} to="/feelings/body-cues" aria-label="Open body cues page">
            <span aria-hidden="true">↗</span><span>Body cues</span>
          </Link>
        </div>

        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <span className="visually-hidden">Search feelings</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search feelings"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className={styles.shuffle}
            onClick={() => setShuffleVersion((current) => current + 1)}
            aria-label="Shuffle magnets"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </button>
        </div>

        {items.length ? (
          <div className={styles.boardWrapper}>
            <MagnetBoard
              items={items}
              playMode={playMode}
              onPlayModeChange={setPlayMode}
              storageKey={normalizedQuery ? `feelings-search:${normalizedQuery}` : '/feelings/:0'}
              shuffleVersion={shuffleVersion}
              ariaLabel="Feelings magnet board"
            />
          </div>
        ) : (
          <p className={styles.empty} role="status">No feelings match “{query}”.</p>
        )}
        <p className="visually-hidden" aria-live="polite">
          Showing {items.length} of {feelings.length} feelings.
        </p>
      </section>
    </section>
  );
}
