import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import { assetPath, feelingsBySlug } from '../../data/catalog';
import { readMagnetPlayPreference } from '../../persistence/magnetLayoutStore';
import styles from './FeelingDetailPage.module.css';

export function FeelingDetailPage() {
  const { slug = '' } = useParams();
  const feeling = feelingsBySlug.get(slug);
  const storageKey = `/feelings/${slug}/:0`;
  const [playMode, setPlayMode] = useState(() => readMagnetPlayPreference(storageKey));
  const [shuffleVersion, setShuffleVersion] = useState(0);

  useEffect(() => {
    setPlayMode(readMagnetPlayPreference(storageKey));
  }, [storageKey]);

  const needs = useMemo<MagnetBoardItem[]>(() => (feeling?.needs ?? []).map((need) => ({
    id: `needs-${need.slug}`,
    label: need.title,
    to: `/needs/${need.slug}`,
    kind: 'need',
    tone: 'sky',
    iconUrl: assetPath(`icons/needs/${need.slug}.svg`),
  })), [feeling]);

  if (!feeling) {
    return (
      <section className={styles.notFound}>
        <h1>Feeling not found</h1>
        <p>This feeling is not in the current production catalog.</p>
        <Link to="/feelings">Return to feelings</Link>
      </section>
    );
  }

  return (
    <article className={styles.page}>
      {needs.length ? (
        <section className={styles.magnetSection} aria-labelledby="related-needs-heading">
          <div className={styles.sectionHeader}>
            <h2 id="related-needs-heading" className={styles.sectionTitle}>Related needs</h2>
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
          <div className={styles.boardWrapper}>
            <MagnetBoard
              items={needs}
              playMode={playMode}
              onPlayModeChange={setPlayMode}
              storageKey={storageKey}
              shuffleVersion={shuffleVersion}
              ariaLabel={`Needs related to ${feeling.title}`}
            />
          </div>
        </section>
      ) : null}

      <header className={styles.header}>
        <h1>Feeling: {feeling.title}</h1>
        <p>{feeling.summary}</p>
      </header>

      {feeling.poem ? (
        <section className={styles.poem} aria-labelledby={`poem-${feeling.slug}`}>
          <h2 id={`poem-${feeling.slug}`} className={styles.sectionTitle}>Poem reflection</h2>
          <figure>
            <blockquote>{feeling.poem.quotation}</blockquote>
            {feeling.poem.url ? (
              <figcaption>
                <a href={feeling.poem.url} target="_blank" rel="noopener noreferrer">Continue reading the poem</a>
              </figcaption>
            ) : null}
          </figure>
        </section>
      ) : null}
    </article>
  );
}
