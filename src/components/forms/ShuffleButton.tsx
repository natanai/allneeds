import styles from './ShuffleButton.module.css';

export function ShuffleButton({ onClick, label = 'Shuffle magnets' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className={styles.button} onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    </button>
  );
}
