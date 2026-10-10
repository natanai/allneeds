import { useMemo, useState } from 'react';

import { CatalogToolbar } from '../../components/forms/CatalogToolbar';
import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import { fauxFeelings } from '../../data/catalog';
import { readBrowseQuery, writeBrowseQuery } from '../../persistence/browseState';
import { readMagnetPlayPreference } from '../../persistence/magnetLayoutStore';
import styles from './FauxFeelingsPage.module.css';

export function FauxFeelingsPage() {
  const [query, setQueryState] = useState(() => readBrowseQuery('faux-feelings'));
  const [playMode, setPlayMode] = useState(() => readMagnetPlayPreference('/faux-feelings/:0'));
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const setQuery = (value: string) => setQueryState(writeBrowseQuery('faux-feelings', value));
  const visible = useMemo(
    () => normalizedQuery
      ? fauxFeelings.filter((feeling) => feeling.title.toLocaleLowerCase().includes(normalizedQuery))
      : fauxFeelings,
    [normalizedQuery],
  );
  const items = useMemo<MagnetBoardItem[]>(() => visible.map((feeling) => ({
    id: `faux-feelings-${feeling.slug}`,
    label: feeling.title,
    to: `/faux-feelings/${feeling.slug}`,
    tone: 'selection',
  })), [visible]);

  return (
    <section className={styles.page} aria-labelledby="faux-feelings-title">
      <header className={styles.pageHeader}>
        <h1 id="faux-feelings-title" className={styles.pageTitle}>Faux Feelings</h1>
        <p>Faux feelings (sometimes called evaluations) are often the first stories that surface. Follow them to the feelings and needs underneath.</p>
      </header>

      <section className={styles.magnetSection} aria-label="Faux Feelings magnets">
        <CatalogToolbar
          searchLabel="Search faux feelings"
          query={query}
          onQueryChange={setQuery}
          onShuffle={() => setShuffleVersion((current) => current + 1)}
        />
        {items.length ? (
          <div className={styles.boardWrapper}>
            <MagnetBoard
              items={items}
              playMode={playMode}
              onPlayModeChange={setPlayMode}
              storageKey={normalizedQuery ? `faux-feelings-search:${normalizedQuery}` : '/faux-feelings/:0'}
              shuffleVersion={shuffleVersion}
              ariaLabel="Faux Feelings magnet board"
            />
          </div>
        ) : <p className={styles.empty} role="status">No faux feelings match “{query}”.</p>}
        <p className="visually-hidden" aria-live="polite">Showing {items.length} of {fauxFeelings.length} faux feelings.</p>
      </section>
    </section>
  );
}
