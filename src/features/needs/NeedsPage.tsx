import { useMemo, useState } from 'react';

import { CatalogToolbar } from '../../components/forms/CatalogToolbar';
import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import { assetPath, needs } from '../../data/catalog';
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
  const items = useMemo<MagnetBoardItem[]>(() => visibleNeeds.map((need) => ({
    id: `needs-${need.slug}`,
    label: need.title,
    to: `/needs/${need.slug}`,
    kind: 'need',
    tone: 'selection',
    iconUrl: assetPath(`icons/needs/${need.slug}.svg`),
  })), [visibleNeeds]);

  return (
    <section className={styles.page} aria-labelledby="needs-title">
      <header className={styles.pageHeader}>
        <h1 id="needs-title" className={styles.pageTitle}>Needs</h1>
      </header>

      <section className={styles.magnetSection} aria-label="Needs magnets">
        <CatalogToolbar
          searchLabel="Search needs"
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
