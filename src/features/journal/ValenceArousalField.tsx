import { useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import type { JournalMood } from './journalRepository';
import styles from './ValenceArousalField.module.css';

type Props = {
  mood?: JournalMood;
  onChange: (mood: JournalMood | undefined) => void;
};

const clamp = (value: number) => Math.min(5, Math.max(-5, Math.round(value)));
const signed = (value: number) => value < 0 ? `−${Math.abs(value)}` : `${value > 0 ? '+' : ''}${value}`;

function pointColor(valence: number, arousal: number) {
  const pleasant = (valence + 5) * 10;
  const activated = (arousal + 5) * 10;
  const low = `color-mix(in srgb, var(--quiet) ${100 - pleasant}%, var(--selection) ${pleasant}%)`;
  const high = `color-mix(in srgb, var(--action) ${100 - pleasant}%, var(--positive) ${pleasant}%)`;
  return `color-mix(in srgb, ${low} ${100 - activated}%, ${high} ${activated}%)`;
}

export function ValenceArousalField({ mood, onChange }: Props) {
  const planeRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [moving, setMoving] = useState(false);
  const [preview, setPreview] = useState<{ valence: number; arousal: number } | null>(null);
  const rated = mood?.kind === 'rated' ? mood : undefined;
  const valence = rated?.value ?? 0;
  const arousal = rated?.arousal ?? 0;
  const hasPoint = rated?.arousal !== undefined;
  const visualValence = preview?.valence ?? valence;
  const visualArousal = preview?.arousal ?? arousal;
  const liveColor = pointColor(visualValence, visualArousal);
  const left = (visualValence + 5) * 10;
  const top = (5 - visualArousal) * 10;
  const pointStyle: CSSProperties = {
    left: `${left}%`,
    top: `${top}%`,
    background: hasPoint || preview ? liveColor : 'var(--surface-raised)',
  };
  // The whole map responds to the chosen coordinates, rather than leaving
  // four static swatches beneath a moving point.
  const planeStyle: CSSProperties = {
    background: hasPoint || preview ? liveColor : 'var(--surface-raised)',
  };

  const setPoint = (nextValence: number, nextArousal: number) => {
    const next = { kind: 'rated' as const, value: clamp(nextValence), arousal: clamp(nextArousal) };
    if (rated?.value === next.value && rated.arousal === next.arousal) return;
    onChange(next);
  };
  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = planeRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const next = { valence: x * 10 - 5, arousal: 5 - y * 10 };
    setPreview(next);
    setPoint(next.valence, next.arousal);
  };
  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const change = event.shiftKey ? 2 : 1;
    let nextValence = hasPoint ? valence : 0;
    let nextArousal = hasPoint ? arousal : 0;
    if (event.key === 'ArrowLeft') nextValence -= change;
    else if (event.key === 'ArrowRight') nextValence += change;
    else if (event.key === 'ArrowDown') nextArousal -= change;
    else if (event.key === 'ArrowUp') nextArousal += change;
    else if (event.key === 'Home') nextValence = nextArousal = 0;
    else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); onChange(undefined); return; }
    else return;
    event.preventDefault();
    setMoving(true);
    setPoint(nextValence, nextArousal);
  };
  const valueText = hasPoint
    ? `Valence ${signed(valence)} · Arousal ${signed(arousal)}`
    : mood?.kind === 'mixed'
      ? 'Mixed feelings selected'
      : mood?.kind === 'unsure'
        ? 'Not sure selected'
        : 'No point placed yet';

  return <div className={styles.field}>
    <div
      ref={planeRef}
      className={styles.plane}
      style={planeStyle}
      data-testid="valence-arousal-field"
      aria-label="Valence and arousal emotional map"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        dragging.current = true;
        setMoving(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => { if (dragging.current) updateFromPointer(event); }}
      onPointerUp={(event) => {
        if (!dragging.current) return;
        updateFromPointer(event);
        dragging.current = false;
        setPreview(null);
        setMoving(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { dragging.current = false; setPreview(null); setMoving(false); }}
    >
      <span className={styles.horizontalAxis} aria-hidden="true" />
      <span className={styles.verticalAxis} aria-hidden="true" />
      <span className={`${styles.axisLabel} ${styles.highLabel}`} aria-hidden="true">High activation</span>
      <span className={`${styles.axisLabel} ${styles.lowLabel}`} aria-hidden="true">Low activation</span>
      <span className={`${styles.axisLabel} ${styles.unpleasantLabel}`} aria-hidden="true">Unpleasant</span>
      <span className={`${styles.axisLabel} ${styles.pleasantLabel}`} aria-hidden="true">Pleasant</span>
      <button
        type="button"
        className={`${styles.point} ${hasPoint ? '' : styles.unplaced}`}
        style={pointStyle}
        aria-label={hasPoint
          ? `Emotional point. Valence ${signed(valence)} from minus 5 to plus 5. Arousal ${signed(arousal)} from minus 5 to plus 5. Use arrow keys to move.`
          : 'Place emotional point. Use arrow keys to start at neutral, or tap the map.'}
        onKeyDown={moveWithKeyboard}
        onBlur={() => setMoving(false)}
        onFocus={() => { if (hasPoint) setMoving(true); }}
      ><span className="visually-hidden">{valueText}</span></button>
    </div>
    <div className={styles.choiceSummary}>
      <div>
        {hasPoint ? <small className={styles.selectionLabel}>Point selected</small> : null}
        <output className={`${styles.values} ${moving ? styles.moving : ''}`} aria-live="polite">{valueText}</output>
      </div>
      <button type="button" className={styles.clear} disabled={!mood} onClick={() => onChange(undefined)}>Clear</button>
    </div>
    <small className={styles.help}>Drag or tap the point. Left/right changes valence (pleasantness); up/down changes arousal (activation or energy).</small>
    <fieldset className={styles.alternatives}>
      <legend>Instead of a point</legend>
      <div className={styles.states}>
        <button type="button" aria-pressed={mood?.kind === 'mixed'} onClick={() => onChange({ kind: 'mixed' })}><span className={styles.choiceCheck} aria-hidden="true">✓</span>Mixed feelings</button>
        <button type="button" aria-pressed={mood?.kind === 'unsure'} onClick={() => onChange({ kind: 'unsure' })}><span className={styles.choiceCheck} aria-hidden="true">✓</span>Not sure</button>
      </div>
    </fieldset>
  </div>;
}
