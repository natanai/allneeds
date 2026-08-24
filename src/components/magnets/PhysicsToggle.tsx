import styles from './PhysicsToggle.module.css';

type PhysicsToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export function PhysicsToggle({ checked, onChange, className = '' }: PhysicsToggleProps) {
  return (
    <label className={`${styles.toggle} ${className}`} data-state={checked ? 'on' : 'off'}>
      <input
        type="checkbox"
        className={styles.input}
        role="switch"
        checked={checked}
        aria-label={checked ? 'Disable magnet physics' : 'Enable magnet physics'}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      <span className="visually-hidden">Physics is {checked ? 'on' : 'off'}</span>
    </label>
  );
}
