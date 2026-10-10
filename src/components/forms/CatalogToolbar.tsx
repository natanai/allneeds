import styles from './CatalogToolbar.module.css';

type CatalogToolbarProps = {
  searchLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  onShuffle: () => void;
};

export function CatalogToolbar({
  searchLabel,
  query,
  onQueryChange,
  onShuffle,
}: CatalogToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <label className={styles.searchField}>
        <span className="visually-hidden">{searchLabel}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchLabel}
          autoComplete="off"
        />
      </label>
      <button type="button" className={styles.shuffle} onClick={onShuffle} aria-label="Shuffle magnets">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
        </svg>
      </button>
    </div>
  );
}
