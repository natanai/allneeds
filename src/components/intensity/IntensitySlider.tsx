import { useId, useState, type CSSProperties } from 'react';
import styles from './IntensitySlider.module.css';

export function formatIntensityRating(value: number, maximum = 10): string {
  return `${Number(value.toFixed(1))}/${maximum}`;
}

type Props = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  valueText?: string;
  lowLabel?: string;
  middleLabel?: string;
  highLabel?: string;
  disabled?: boolean;
};

/**
 * Shared, theme-aware intensity control. A native input owns interaction and
 * accessibility; the glass treatment is only a visual enhancement.
 */
export function IntensitySlider({
  value, onChange, label, min = 0, max = 10, step = 1, id, valueText,
  lowLabel, middleLabel, highLabel, disabled = false,
}: Props) {
  const generatedId = useId();
  const [dragging, setDragging] = useState(false);
  const fraction = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const positionStyle = {
    '--slider-progress': `${fraction * 100}%`,
    // Account for the thumb width so the bubble stays centered at each end.
    '--slider-bubble-offset': `${(0.5 - fraction) * 24}px`,
  } as CSSProperties;

  return <div className={styles.root} style={positionStyle} data-dragging={dragging ? 'true' : undefined}>
    <div className={styles.trackArea}>
      <input
        id={id ?? generatedId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={valueText ?? (value === 0 && min === 0 ? 'Not selected' : `${value} out of ${max}`)}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onTouchStart={() => setDragging(true)}
        onTouchEnd={() => setDragging(false)}
        onTouchCancel={() => setDragging(false)}
        onBlur={() => setDragging(false)}
      />
      {/* Overlay lives above the native range thumb. The native input still owns every gesture,
          keyboard action, and screen-reader announcement; this layer never receives pointers. */}
      <output className={styles.glassThumb} aria-hidden="true">{formatIntensityRating(value, max)}</output>
    </div>
    {(lowLabel || middleLabel || highLabel) && (
      <div className={styles.scale} data-middle={middleLabel ? "true" : "false"} aria-hidden="true">
        <span>{lowLabel ?? ''}</span>
        {middleLabel ? <span>{middleLabel}</span> : null}
        <span>{highLabel ?? ''}</span>
      </div>
    )}
  </div>;
}
