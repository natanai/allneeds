import { useMemo, useState } from 'react';

import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem, MagnetTone } from '../../components/magnets/MagnetBoard';
import styles from './FeelingsPage.module.css';

const feelingNames = [
  'Afraid',
  'Alarmed',
  'Angry',
  'Anxious',
  'Bewildered',
  'Calm',
  'Enraged',
  'Excited',
  'Frightened',
  'Frustrated',
  'Helpless',
  'Hopeful',
  'Hurt',
  'Jealous',
  'Joyful',
  'Lonely',
  'Playful',
  'Proud',
  'Relaxed',
  'Sad',
  'Scared',
  'Tense',
  'Terrified',
  'Tired',
] as const;

const tones: MagnetTone[] = ['rose', 'mint', 'gold', 'sky', 'lavender', 'peach'];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const prototypeFeelings: MagnetBoardItem[] = feelingNames.map((label, index) => ({
  id: slugify(label),
  label,
  to: `/feelings/${slugify(label)}`,
  tone: tones[index % tones.length],
}));

export function FeelingsPage() {
  const [query, setQuery] = useState('');
  const [playMode, setPlayMode] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);

  const visibleFeelings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return prototypeFeelings;
    return prototypeFeelings.filter((feeling) => feeling.label.toLowerCase().includes(normalized));
  }, [query]);

  const togglePlayMode = () => {
    setPlayMode((current) => !current);
  };

  const resetMagnets = () => {
    setResetVersion((current) => current + 1);
  };

  return (
    <section className={styles.page} aria-labelledby="feelings-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>V2 magnet prototype</p>
          <h1 id="feelings-title">Feelings</h1>
          <p className={styles.lede}>
            A first look at the new tactile system. The vocabulary below is a representative production set while the full canonical data importer is built.
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span>Find a feeling</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try calm, hurt, anxious…"
          />
        </label>

        <div className={styles.actions} aria-label="Magnet controls">
          <button type="button" className={styles.playButton} aria-pressed={playMode} onClick={togglePlayMode}>
            {playMode ? 'Finish arranging' : 'Play with magnets'}
          </button>
          <button type="button" className={styles.resetButton} onClick={resetMagnets} disabled={!playMode}>
            Reset positions
          </button>
        </div>
      </div>

      <div className={styles.behaviorNote} role="note">
        <span className={styles.statusDot} aria-hidden="true" />
        <div>
          <strong>{playMode ? 'Play mode is on.' : 'Stable layout is on.'}</strong>
          <span>
            {playMode
              ? ' Drag any magnet. Only the magnet under your pointer moves; there is no drift, collision solver, or background physics.'
              : ' Magnets stay in normal document flow with a deterministic tilt. Nothing is continuously recalculating their positions.'}
          </span>
        </div>
      </div>

      {visibleFeelings.length ? (
        <MagnetBoard
          key={`${resetVersion}-${query}`}
          items={visibleFeelings}
          playMode={playMode}
          ariaLabel="Feelings magnet board"
        />
      ) : (
        <div className={styles.emptyState}>
          <h2>No matching feeling yet.</h2>
          <p>Try a shorter search term or clear the search field.</p>
        </div>
      )}

      <p className={styles.resultCount} aria-live="polite">
        Showing {visibleFeelings.length} of {prototypeFeelings.length} prototype feelings.
      </p>

      <aside className={styles.nextStep}>
        <strong>What is intentionally missing?</strong>
        <p>
          Clicking a magnet currently opens the reserved V2 detail route. The next slice will replace those placeholders with canonical production descriptions, relationships, body cues, and stable legacy slugs.
        </p>
      </aside>
    </section>
  );
}
