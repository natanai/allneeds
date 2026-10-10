import styles from './CatalogToolbar.module.css';
import { ShuffleButton } from './ShuffleButton';

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
      <ShuffleButton onClick={onShuffle} />
    </div>
  );
}
