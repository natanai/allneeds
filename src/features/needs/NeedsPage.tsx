import { useMemo, useState } from 'react';

import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import { needMagnetItem } from '../../components/magnets/catalogMagnetItems';
import { needs } from '../../data/catalog';
import { readBrowseQuery, writeBrowseQuery } from '../../persistence/browseState';
import { readMagnetPlayPreference } from '../../persistence/magnetLayoutStore';
import styles from './NeedsPage.module.css';

export function NeedsPage() {
  const [query, setQueryState] = useState(() => readBrowseQuery('needs'));
  const [playMode, setPlayMode] = useState(() => readMagnetPlayPreference('/needs/:0'));
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const setQuery = (value: string) => setQueryState(writeBrowseQuery('needs', value));
  const visibleNeeds = useMemo(
    () => normalizedQuery
      ? needs.filter((need) => need.title.toLocaleLowerCase().includes(normalizedQuery))
      : needs,
    [normalizedQuery],
  );
  const items = useMemo(() => visibleNeeds.map(needMagnetItem), [visibleNeeds]);

  return (
    <section className={styles.page} aria-labelledby="needs-title">
      <header className={styles.pageHeader}>
        <h1 id="needs-title" className={styles.pageTitle}>Needs</h1>
      </header>

      <section className={styles.magnetSection} aria-label="Needs magnets">
        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <span className="visually-hidden">Search needs</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search needs"
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
              storageKey={normalizedQuery ? `needs-search:${normalizedQuery}` : '/needs/:0'}
              shuffleVersion={shuffleVersion}
              ariaLabel="Needs magnet board"
            />
          </div>
        ) : (
          <p className={styles.empty} role="status">No needs match “{query}”.</p>
        )}
        <p className="visually-hidden" aria-live="polite">
          Showing {items.length} of {needs.length} needs.
        </p>
      </section>
    </section>
  );
}
