import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import { ShuffleButton } from '../../components/forms/ShuffleButton';
import { assetPath, fauxFeelingsBySlug } from '../../data/catalog';
import { readMagnetPlayPreference } from '../../persistence/magnetLayoutStore';
import styles from './FauxFeelingDetailPage.module.css';

type RelatedBoardProps = {
  title: string;
  items: MagnetBoardItem[];
  storageKey: string;
};

function RelatedBoard({ title, items, storageKey }: RelatedBoardProps) {
  const [playMode, setPlayMode] = useState(() => readMagnetPlayPreference(storageKey, true));
  const [shuffleVersion, setShuffleVersion] = useState(0);
  return (
    <section className={styles.related} aria-labelledby={`${storageKey}-title`}>
      <div className={styles.sectionHeader}>
        <h2 id={`${storageKey}-title`}>{title}</h2>
        <ShuffleButton onClick={() => setShuffleVersion((current) => current + 1)} />
      </div>
      <div className={styles.boardWrapper}>
        <MagnetBoard items={items} playMode={playMode} onPlayModeChange={setPlayMode} storageKey={storageKey} shuffleVersion={shuffleVersion} ariaLabel={`${title} magnet board`} />
      </div>
    </section>
  );
}

export function FauxFeelingDetailPage() {
  const { slug = '' } = useParams();
  const fauxFeeling = fauxFeelingsBySlug.get(slug);
  const feelingItems = useMemo<MagnetBoardItem[]>(() => fauxFeeling?.feelings.map((feeling) => ({
    id: `feelings-${feeling.slug}`,
    label: feeling.title,
    to: `/feelings/${feeling.slug}`,
    kind: 'feeling',
    tone: 'selection',
    iconUrl: assetPath(`icons/feelings/${feeling.slug}.svg`),
  })) ?? [], [fauxFeeling]);
  const needItems = useMemo<MagnetBoardItem[]>(() => fauxFeeling?.needs.map((need) => ({
    id: `needs-${need.slug}`,
    label: need.title,
    to: `/needs/${need.slug}`,
    kind: 'need',
    tone: 'selection',
    iconUrl: assetPath(`icons/needs/${need.slug}.svg`),
  })) ?? [], [fauxFeeling]);

  if (!fauxFeeling) {
    return <section className={styles.notFound}><h1>Faux feeling not found</h1><Link to="/faux-feelings">Return to faux feelings</Link></section>;
  }

  return (
    <article className={styles.page}>
      <h1>Faux feeling: {fauxFeeling.title}</h1>
      {feelingItems.length ? <RelatedBoard title="Feelings" items={feelingItems} storageKey={`/faux-feelings/${slug}:feelings`} /> : null}
      {needItems.length ? <RelatedBoard title="Needs" items={needItems} storageKey={`/faux-feelings/${slug}:needs`} /> : null}
    </article>
  );
}
