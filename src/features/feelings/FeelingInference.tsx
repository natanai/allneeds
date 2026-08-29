import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';

import { useDialogFocus } from '../../app/useDialogFocus';
import {
  collectFeelingEvidence,
  formatZoneLabel,
  normalizeIntensityBand,
  type FeelingBodyCue,
  type FeelingInferenceEntry,
  type ZoneSuggestion,
} from './feelingInferenceModel';
import styles from './FeelingInference.module.css';

const arousalLabels: Record<string, string> = {
  high: 'High energy',
  medium: 'Moderate energy',
  low: 'Low energy',
};

type FeelingInferenceProps = {
  entry: FeelingInferenceEntry;
  feelingKey: string;
  feelingTitle: string;
  zoneSuggestions?: Record<string, ZoneSuggestion>;
};

function groupBodyCues(cues: FeelingBodyCue[]) {
  const groups = new Map<string, { label: string; cues: FeelingBodyCue[] }>();
  cues.forEach((cue) => {
    const group = groups.get(cue.regionId) ?? { label: cue.regionLabel, cues: [] };
    group.cues.push(cue);
    groups.set(cue.regionId, group);
  });
  return [...groups.entries()].map(([id, group]) => ({ id, ...group }));
}

function IntensityDisplay({ cue }: { cue: FeelingBodyCue }) {
  const band = normalizeIntensityBand(cue.intensityBand);
  const energyLabel = cue.arousal ? arousalLabels[cue.arousal] : '';
  const rangeLabel = band ? `${band[0]}–${band[1]} / 10` : '';
  const label = [energyLabel, rangeLabel].filter(Boolean).join(' · ') || 'Intensity varies';
  const start = band ? Math.max(0, Math.min(100, band[0] * 10)) : 0;
  const end = band ? Math.max(start, Math.min(100, band[1] * 10)) : 0;
  const width = band ? Math.min(100 - start, Math.max(4, end - start)) : 0;

  return (
    <div className={styles.intensity}>
      <div className={styles.intensityLabel}>{label}</div>
      {band ? (
        <div className={styles.intensityMeter} role="img" aria-label={`Typical intensity ${band[0]} to ${band[1]} on a 0 to 10 scale.`}>
          <span className={styles.intensityFill} style={{ left: `${start}%`, width: `${width}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export function FeelingInference({
  entry,
  feelingKey,
  feelingTitle,
  zoneSuggestions = {},
}: FeelingInferenceProps) {
  const [expanded, setExpanded] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const evidenceDialogRef = useDialogFocus<HTMLElement>({
    open: evidenceOpen,
    onClose: () => setEvidenceOpen(false),
  });
  const groups = useMemo(() => groupBodyCues(entry.bodyCues ?? []), [entry.bodyCues]);
  const evidence = useMemo(
    () => collectFeelingEvidence(entry, feelingKey),
    [entry, feelingKey],
  );
  const panelId = `feeling-inference-${feelingKey}`;
  const evidenceTitleId = `feeling-inference-evidence-${feelingKey}`;

  useEffect(() => {
    setExpanded(false);
    setEvidenceOpen(false);
  }, [feelingKey]);

  function togglePanel() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      window.requestAnimationFrame(() => {
        panelRef.current?.focus({ preventScroll: true });
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  return (
    <section className={styles.wrapper} aria-label={`Feeling word support for ${feelingTitle}`}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={togglePanel}
      >
        <span className={styles.toggleCopy}>
          <span className={styles.badge}>Feeling word support</span>
          <span className={styles.toggleLabel}>How this feeling may show up</span>
        </span>
      </button>

      {expanded ? (
        <div id={panelId} className={styles.panel}>
          <section ref={panelRef} className={styles.inference} tabIndex={-1}>
            {entry.zones?.length ? (
              <section className={styles.section}>
                <h3 className={styles.subheading}>Typical pattern</h3>
                <div className={styles.zones}>
                  {entry.zones.map((zone, index) => (
                    <span
                      key={zone}
                      className={`${styles.zoneChip} ${index === 0 ? styles.primaryZone : ''}`}
                      aria-label={index === 0 ? `${formatZoneLabel(zone, zoneSuggestions)} (primary)` : undefined}
                    >
                      {formatZoneLabel(zone, zoneSuggestions)}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className={styles.section}>
              <h3 className={styles.subheading}>Body cues</h3>
              <p className={styles.disclaimer}>Possible cues, not a checklist or diagnosis.</p>
              <div className={styles.bodyGroups}>
                {groups.map((group) => (
                  <article key={group.id} className={styles.bodyRegion} data-region-id={group.id}>
                    <h4 className={styles.regionTitle}>{group.label}</h4>
                    {group.cues.map((cue) => (
                      <div key={cue.optionId} className={styles.cue} data-option-id={cue.optionId}>
                        <h5 className={styles.cueTitle}>{cue.title}</h5>
                        {cue.note ? <p className={styles.cueNote}>{cue.note}</p> : null}
                        <IntensityDisplay cue={cue} />
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </section>

            <div className={styles.actions}>
              <button type="button" onClick={() => setEvidenceOpen(true)}>Why these?</button>
              <Link to="/alexithymia-support">Start a present-moment check-in</Link>
            </div>
          </section>
        </div>
      ) : null}

      {evidenceOpen ? (
        <div className={styles.popoverBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEvidenceOpen(false);
        }}>
          <section
            ref={evidenceDialogRef}
            className={styles.popover}
            role="dialog"
            aria-modal="true"
            aria-labelledby={evidenceTitleId}
            tabIndex={-1}
          >
            <header className={styles.popoverHeader}>
              <h3 id={evidenceTitleId}>Why these?</h3>
              <button type="button" onClick={() => setEvidenceOpen(false)} data-dialog-initial-focus>Close</button>
            </header>
            <div className={styles.popoverBody} data-feeling-evidence-body>
              <ul className={styles.evidenceList}>
                {evidence.supports.map((support) => (
                  <li key={`${support.label}|${support.ref ?? ''}|${support.href ?? ''}`}>
                    <strong>{support.label}</strong>
                    {support.ref ? support.href ? (
                      <a href={support.href} target="_blank" rel="noopener noreferrer">{support.ref}</a>
                    ) : <span>{support.ref}</span> : null}
                  </li>
                ))}
              </ul>
              <h4>Limitations</h4>
              <ul className={styles.limitations}>{evidence.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
