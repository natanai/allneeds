import type { ButtonHTMLAttributes } from 'react';

import styles from './SaveControl.module.css';

type SaveControlProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  target: 'device' | 'profile';
  compact?: boolean;
  saved?: boolean;
  label?: string;
};

export function SaveControl({ target, compact = false, saved = false, label, className = '', ...props }: SaveControlProps) {
  const visibleLabel = label ?? (compact ? target[0]!.toUpperCase() + target.slice(1) : `Save to ${target}`);
  return (
    <button
      {...props}
      className={`${styles.control} ${compact ? styles.compact : ''} ${styles[target]} ${saved ? styles.saved : ''} ${className}`.trim()}
      aria-label={props['aria-label'] ?? (saved ? `Saved to ${target}` : `Save to ${target}`)}
      aria-pressed={saved || props['aria-pressed']}
      disabled={saved || props.disabled}
    >
      {visibleLabel}
    </button>
  );
}
