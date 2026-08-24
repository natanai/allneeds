import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { needs } from '../../data/catalog';
import styles from './NeedCatalogPicker.module.css';

type NeedCatalogPickerProps = {
  labelId: string;
  selectedNeeds: string[];
  onChange: (selectedNeeds: string[]) => void;
};

const sortedNeeds = [...needs].sort((left, right) => left.title.localeCompare(right.title));

export function NeedCatalogPicker({ labelId, selectedNeeds, onChange }: NeedCatalogPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const popoverId = `need-picker-${generatedId}`;

  const visibleNeeds = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? sortedNeeds.filter((need) => need.title.toLocaleLowerCase().includes(normalized))
      : sortedNeeds;
  }, [query]);

  const selectedTitles = selectedNeeds
    .map((slug) => sortedNeeds.find((need) => need.slug === slug)?.title)
    .filter((title): title is string => Boolean(title));

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const toggleNeed = (slug: string) => {
    onChange(selectedNeeds.includes(slug)
      ? selectedNeeds.filter((value) => value !== slug)
      : [...selectedNeeds, slug]);
  };

  return (
    <div ref={rootRef} className={styles.picker}>
      <button
        type="button"
        className={styles.trigger}
        aria-labelledby={labelId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selectedTitles.length ? styles.value : styles.placeholder}>
          {selectedTitles.length ? selectedTitles.join(', ') : 'Choose needs'}
        </span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>

      {open ? (
        <div id={popoverId} className={styles.popover} role="dialog" aria-label="Choose one or more needs">
          <div className={styles.toolbar}>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search needs"
              placeholder="Search needs"
              autoComplete="off"
            />
          </div>
          <div className={styles.options} role="listbox" aria-multiselectable="true">
            {visibleNeeds.map((need) => {
              const selected = selectedNeeds.includes(need.slug);
              return (
                <button
                  key={need.slug}
                  type="button"
                  className={styles.option}
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggleNeed(need.slug)}
                >
                  <span>{need.title}</span>
                  <span className={styles.check} aria-hidden="true">{selected ? '✓' : ''}</span>
                </button>
              );
            })}
            {!visibleNeeds.length ? <p className={styles.empty}>No needs match “{query}”.</p> : null}
          </div>
          <div className={styles.footer}>
            <button type="button" onClick={() => onChange([])}>Clear</button>
            <button type="button" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
