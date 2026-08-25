import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import magnetStyles from '../../components/magnets/MagnetBoard.module.css';
import { assetPath } from '../../data/catalog';
import {
  readTheme,
  themeCssValues,
  type ThemeState,
} from '../customizer/customizerSettings';
import { resolveThemePresetName, themePresets } from '../customizer/themePresets';
import {
  needMagnetAuditCandidates,
  type NeedMagnetAuditCandidate,
} from './needMagnetAuditCandidates';
import styles from './NeedMagnetAuditPage.module.css';

type CustomProperties = CSSProperties & Record<`--${string}`, string | number>;
type ThemeChoice = Readonly<{
  id: string;
  label: string;
  theme: Pick<ThemeState, 'values' | 'roundness'>;
}>;

function themeStyle(theme: Pick<ThemeState, 'values' | 'roundness'>): CSSProperties {
  return themeCssValues(theme) as CSSProperties;
}

function candidateStyle(candidate: NeedMagnetAuditCandidate): CustomProperties {
  return {
    '--magnet-icon': `url("${assetPath(candidate.iconPath)}")`,
    '--audit-face': candidate.faceBackground,
    '--audit-icon-fill': candidate.iconFill,
    '--audit-art-a': candidate.artA,
    '--audit-art-b': candidate.artB,
    '--audit-art-opacity': String(candidate.artOpacity ?? 0),
    ...(candidate.artMaskPath
      ? { '--audit-art-mask': `url("${assetPath(candidate.artMaskPath)}")` }
      : {}),
  };
}

function AuditMagnet({ candidate }: { candidate: NeedMagnetAuditCandidate }) {
  return (
    <span
      className={`${magnetStyles.magnet} ${magnetStyles.sky} ${magnetStyles.need} ${styles.previewMagnet}`}
      style={candidateStyle(candidate)}
      aria-label={`${candidate.needTitle} magnet preview: ${candidate.title}`}
    >
      {candidate.artMaskPath ? <span className={styles.art} aria-hidden="true" /> : null}
      <span className={magnetStyles.label}>{candidate.needTitle}</span>
    </span>
  );
}

function CandidateCard({
  candidate,
  selectedTheme,
}: {
  candidate: NeedMagnetAuditCandidate;
  selectedTheme: Pick<ThemeState, 'values' | 'roundness'>;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.heroStage} style={themeStyle(selectedTheme)}>
        <span className={styles.heroScale}>
          <AuditMagnet candidate={candidate} />
        </span>
      </div>

      <div className={styles.actualRow} style={themeStyle(selectedTheme)}>
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
  const currentTheme = useMemo(() => readTheme(), []);
  const currentPreset = resolveThemePresetName(currentTheme);
  const choices = useMemo<readonly ThemeChoice[]>(() => [
    {
      id: 'current',
      label: currentPreset ? `Current Customizer · ${currentPreset}` : 'Current Customizer',
      theme: currentTheme,
    },
    ...themePresets.map((preset) => ({
      id: `preset:${preset.name}`,
      label: preset.name,
      theme: preset,
    })),
  ], [currentPreset, currentTheme]);

  const [choiceId, setChoiceId] = useState('current');
  const initial = choices[0] ?? { id: 'current', label: 'Current Customizer', theme: currentTheme };
  const [roundness, setRoundness] = useState(initial.theme.roundness);
  const selectedChoice = choices.find((choice) => choice.id === choiceId) ?? initial;
  const selectedTheme = {
    values: selectedChoice.theme.values,
    roundness,
  };

  const chooseTheme = (id: string) => {
    const next = choices.find((choice) => choice.id === id) ?? initial;
    setChoiceId(next.id);
    setRoundness(next.theme.roundness);
  };

  const groups = [
    ['connection', 'Connection'],
    ['support', 'Support'],
  ] as const;

  return (
    <section className={styles.page} aria-labelledby="need-magnet-audit-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Design Lab</p>
        <h1 id="need-magnet-audit-title">Need magnet audit</h1>
        <p>
          Review-only mockups rendered with the production Need magnet CSS, production icons,
          and live Customizer presets. Nothing shown here changes the public Needs board until a
          design is separately approved and implemented.
        </p>
      </header>

      <section className={styles.controls} aria-label="Preview controls">
        <label>
          <span>Preview palette</span>
          <select value={choiceId} onChange={(event) => chooseTheme(event.target.value)}>
            {choices.map((choice) => (
              <option key={choice.id} value={choice.id}>{choice.label}</option>
            ))}
          </select>
        </label>
        <label className={styles.roundnessControl}>
          <span>Corner roundness · {roundness}%</span>
          <input
            type="range"
            min="0"
            max="200"
            value={roundness}
            onChange={(event) => setRoundness(Number(event.target.value))}
          />
        </label>
      </section>

      {groups.map(([slug, title]) => {
        const candidates = needMagnetAuditCandidates.filter((candidate) => candidate.needSlug === slug);
        return (
          <section key={slug} className={styles.group} aria-labelledby={`audit-${slug}`}>
            <h2 id={`audit-${slug}`}>{title}</h2>
            <div className={styles.grid}>
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  selectedTheme={selectedTheme}
                />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
