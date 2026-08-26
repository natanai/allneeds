import type { CSSProperties } from 'react';

import magnetStyles from '../../components/magnets/MagnetBoard.module.css';
import { assetPath } from '../../data/catalog';
import { themeCssValues, type ThemeState } from '../customizer/customizerSettings';
import { themePresets } from '../customizer/themePresets';
import {
  needMagnetAuditCandidates,
  type NeedMagnetAuditCandidate,
} from './needMagnetAuditCandidates';
import styles from './NeedMagnetAuditPage.module.css';

type CustomProperties = CSSProperties & Record<`--${string}`, string | number>;

function themeStyle(theme: Pick<ThemeState, 'values' | 'roundness'>): CSSProperties {
  return themeCssValues(theme) as CSSProperties;
}

function candidateStyle(candidate: NeedMagnetAuditCandidate): CustomProperties {
  return {
    '--magnet-icon': `url("${assetPath(candidate.iconPath)}")`,
    '--audit-face': candidate.faceBackground,
    '--audit-icon-fill': candidate.iconFill,
    '--audit-icon-opacity': candidate.hideIcon ? 0 : 1,
    '--audit-secondary-icon-fill': candidate.secondaryIconFill ?? candidate.iconFill,
    '--audit-art-a': candidate.artA,
    '--audit-art-b': candidate.artB,
    '--audit-art-opacity': String(candidate.artOpacity ?? 0),
    ...(candidate.secondaryIconPath
      ? { '--audit-secondary-icon': `url("${assetPath(candidate.secondaryIconPath)}")` }
      : {}),
    ...(candidate.artMaskPath
      ? { '--audit-art-mask': `url("${assetPath(candidate.artMaskPath)}")` }
      : {}),
  };
}

function AuditMagnet({ candidate }: { candidate: NeedMagnetAuditCandidate }) {
  return (
    <span
      className={`${magnetStyles.magnet} ${magnetStyles.selection} ${magnetStyles.need} ${styles.previewMagnet}`}
      style={candidateStyle(candidate)}
      aria-label={`${candidate.needTitle} magnet preview: ${candidate.title}`}
    >
      {candidate.artMaskPath ? <span className={styles.art} aria-hidden="true" /> : null}
      <span className={magnetStyles.label}>{candidate.needTitle}</span>
      {candidate.secondaryIconPath ? <span className={styles.secondaryIcon} aria-hidden="true" /> : null}
    </span>
  );
}

function CandidateCard({ candidate }: { candidate: NeedMagnetAuditCandidate }) {
  return (
    <article className={styles.card}>
      <div className={styles.heroStage}>
        <span className={styles.heroScale}>
          <AuditMagnet candidate={candidate} />
        </span>
      </div>

      <div className={styles.actualRow}>
        <span className={styles.actualLabel}>actual size</span>
        <AuditMagnet candidate={candidate} />
      </div>

      <div className={styles.presetArea}>
        <span className={styles.presetLabel}>presets</span>
        <div className={styles.presetGrid}>
          {themePresets.map((preset) => (
            <div key={preset.name} className={styles.presetItem} style={themeStyle(preset)}>
              <AuditMagnet candidate={candidate} />
              <span>{preset.name}</span>
            </div>
          ))}
        </div>
      </div>

      <h3>{candidate.title}</h3>
      <p>{candidate.description}</p>
    </article>
  );
}

export function NeedMagnetAuditPage() {
  const groups = [...new Map(
    needMagnetAuditCandidates.map((candidate) => [candidate.needSlug, candidate.needTitle] as const),
  )];

  return (
    <section className={styles.page} aria-labelledby="need-magnet-audit-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Design Lab</p>
        <h1 id="need-magnet-audit-title">Need magnet audit</h1>
        <p>
          Active candidates inherit the real site Customizer directly. Open the Customizer to test
          palette roles and corner roundness; preset rows remain fixed comparisons. Approved designs
          are promoted out of this lab instead of remaining as review clutter.
        </p>
      </header>

      {groups.map(([slug, title]) => {
        const candidates = needMagnetAuditCandidates.filter((candidate) => candidate.needSlug === slug);
        return (
          <section key={slug} className={styles.group} aria-labelledby={`audit-${slug}`}>
            <h2 id={`audit-${slug}`}>{title}</h2>
            <div className={styles.grid}>
              {candidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
