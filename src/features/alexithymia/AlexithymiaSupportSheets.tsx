import { createPortal } from 'react-dom';
import { Link } from 'react-router';

import { useDialogFocus } from '../../app/useDialogFocus';
import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import { assetPath, needs } from '../../data/catalog';
import { describeCueIntensity } from '../bodyCues/bodyCueMath';
import type { CandidateClueScore, ShapeSelections } from './alexithymiaMath';
import { roundedMatchPercent } from './alexithymiaMath';
import type { ShapeDimension } from './alexithymiaData';
import type { SupportTerm } from './alexithymiaTerms';
import styles from './AlexithymiaSupportPage.module.css';

export type BodyOption = {
  id: string;
  title: string;
  note: string;
  defaultIntensity?: number;
  emotions?: Record<string, number>;
};

export type BodyRegion = {
  id: string;
  label: string;
  prompt: string;
  options: BodyOption[];
};

type SupportSheetProps = {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

export function SupportSheet({
  open,
  title,
  titleId,
  onClose,
  children,
  wide = false,
}: SupportSheetProps) {
  const dialogRef = useDialogFocus<HTMLElement>({ open, onClose });
  if (!open) return null;
  return createPortal(
    <div className={styles.sheetBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        ref={dialogRef}
        className={`${styles.sheet} ${wide ? styles.sheetWide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.sheetHandle} aria-hidden="true" />
        <header className={styles.sheetHeader}>
          <h2 id={titleId}>{title}</h2>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label={`Close ${title}`}>
            <CloseIcon />
          </button>
        </header>
        <div className={styles.sheetBody}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}

export function BodyClueSheet({
  open,
  regions,
  openRegion,
  selected,
  onRegionChange,
  onSelectedChange,
  onNothingClear,
  onClose,
}: {
  open: boolean;
  regions: BodyRegion[];
  openRegion: string;
  selected: Record<string, number>;
  onRegionChange: (regionId: string) => void;
  onSelectedChange: (selected: Record<string, number>) => void;
  onNothingClear: () => void;
  onClose: () => void;
}) {
  const region = regions.find((item) => item.id === openRegion) ?? regions[0]!;
  return (
    <SupportSheet open={open} title="Body clues" titleId="alex-body-sheet-title" onClose={onClose} wide>
      <p className={styles.sheetIntro}>Choose sensations that stand out. You can leave every other cue off.</p>
      <div className={styles.bodySheetLayout}>
        <nav className={styles.regionPanel} aria-label="Body regions">
          <p className={styles.regionPickerLabel}>Choose an area</p>
          <div className={styles.regionPicker} role="list">
            {regions.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === region.id}
                onClick={() => onRegionChange(item.id)}
              >
                <span>{item.label}</span>
                {item.options.some((option) => (selected[option.id] ?? 0) > 0) ? <span className={styles.regionSelected} aria-label="has selected cues">✓</span> : null}
              </button>
            ))}
          </div>
        </nav>

        <section className={styles.bodyRegionSheet} aria-labelledby={`alex-region-${region.id}`}>
          <header>
            <p className={styles.regionEyebrow}>Right now</p>
            <h3 id={`alex-region-${region.id}`}>{region.label}</h3>
            <p>{region.prompt}</p>
          </header>
          <div className={styles.bodyOptions}>
            {region.options.map((option) => {
              const value = selected[option.id] ?? 0;
              const active = value > 0;
              return (
                <article key={option.id} className={styles.bodyOption} data-active={active ? 'true' : undefined}>
                  <button type="button" aria-pressed={active} onClick={() => {
                    const next = { ...selected };
                    if (active) delete next[option.id];
                    else next[option.id] = Math.max(5, (option.defaultIntensity ?? 5) * 10);
                    onSelectedChange(next);
                  }}>
                    <span><strong>{option.title}</strong><small>{option.note}</small></span>
                    <span className={styles.bodyCheck} aria-hidden="true">{active ? '✓' : '+'}</span>
                  </button>
                  {active ? (
                    <label className={styles.bodyIntensity}>
                      <span>Intensity <output>{describeCueIntensity(value)}</output></span>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={value}
                        aria-label={`${option.title} intensity`}
                        aria-valuetext={describeCueIntensity(value)}
                        onInput={(event) => onSelectedChange({ ...selected, [option.id]: Number(event.currentTarget.value) })}
                      />
                    </label>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <div className={styles.sheetFooterSplit}>
        <Link to="/feelings/body-cues">Open full Body Cues</Link>
        <button type="button" className={styles.textButton} onClick={onNothingClear}>Nothing clear in my body</button>
        <button type="button" className={styles.primaryButton} onClick={onClose}>Done</button>
      </div>
    </SupportSheet>
  );
}

const shapeControls: Array<{
  dimension: ShapeDimension;
  label: string;
  low: string;
  high: string;
  disclosure?: string;
}> = [
  { dimension: 'pleasantness', label: 'Pleasantness', low: 'Unpleasant', high: 'Pleasant' },
  { dimension: 'energy', label: 'Energy', low: 'Low', high: 'High' },
  {
    dimension: 'power',
    label: 'Power / control',
    low: 'Less able to influence this',
    high: 'More able to influence this',
    disclosure: 'This asks whether you feel able to influence or respond to what is happening. It is not a judgment about whether you should be in control.',
  },
  {
    dimension: 'expectedness',
    label: 'Expectedness',
    low: 'Expected or familiar',
    high: 'Sudden or surprising',
    disclosure: 'This asks whether what happened felt familiar or expected, or sudden and new.',
  },
];

function ShapeScale({
  dimension,
  label,
  low,
  high,
  disclosure,
  value,
  onChange,
}: (typeof shapeControls)[number] & { value?: number; onChange: (value: number | undefined) => void }) {
  const positions = [0, 0.25, 0.5, 0.75, 1];
  return (
    <fieldset className={styles.shapeScale}>
      <legend>
        <span>{label}</span>
        {disclosure ? (
          <details>
            <summary aria-label={`About ${label}`}><InfoIcon /></summary>
            <p>{disclosure}</p>
          </details>
        ) : null}
      </legend>
      <div className={styles.shapePositions}>
        {positions.map((position, index) => (
          <label key={position} aria-label={`${label}: position ${index + 1} of 5`}>
            <input
              type="radio"
              name={`alex-shape-${dimension}`}
              value={position}
              checked={value === position}
              onChange={() => onChange(position)}
            />
            <span aria-hidden="true">{index + 1}</span>
          </label>
        ))}
      </div>
      <div className={styles.shapeEndpoints} aria-hidden="true"><span>{low}</span><span>{high}</span></div>
      <button
        type="button"
        className={styles.notSureButton}
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
      >
        Not sure
      </button>
    </fieldset>
  );
}

export function FeelingShapeSheet({
  open,
  shape,
  onChange,
  onClose,
}: {
  open: boolean;
  shape: ShapeSelections;
  onChange: (shape: ShapeSelections) => void;
  onClose: () => void;
}) {
  return (
    <SupportSheet open={open} title="Feeling shape" titleId="alex-shape-sheet-title" onClose={onClose} wide>
      <p className={styles.sheetIntro}>Place any parts you can sense. Each scale is optional.</p>
      <div className={styles.shapeGroups}>
        <section className={styles.shapeGroup} aria-labelledby="alex-shape-core-title">
          <header>
            <p>Start here</p>
            <h3 id="alex-shape-core-title">Core shape</h3>
            <span>Use either scale that feels available.</span>
          </header>
          <div className={styles.shapeScales}>
            {shapeControls.slice(0, 2).map((control) => (
              <ShapeScale
                key={control.dimension}
                {...control}
                value={shape[control.dimension]}
                onChange={(value) => {
                  const next = { ...shape };
                  if (value === undefined) delete next[control.dimension];
                  else next[control.dimension] = value;
                  onChange(next);
                }}
              />
            ))}
          </div>
        </section>
        <section className={`${styles.shapeGroup} ${styles.shapeGroupSecondary}`} aria-labelledby="alex-shape-context-title">
          <header>
            <p>Optional detail</p>
            <h3 id="alex-shape-context-title">Situation shape</h3>
            <span>These clues can narrow the comparison.</span>
          </header>
          <div className={styles.shapeScales}>
            {shapeControls.slice(2).map((control) => (
              <ShapeScale
                key={control.dimension}
                {...control}
                value={shape[control.dimension]}
                onChange={(value) => {
                  const next = { ...shape };
                  if (value === undefined) delete next[control.dimension];
                  else next[control.dimension] = value;
                  onChange(next);
                }}
              />
            ))}
          </div>
        </section>
      </div>
      <div className={styles.sheetFooter}><button type="button" className={styles.primaryButton} onClick={onClose}>Done</button></div>
    </SupportSheet>
  );
}

function percentLine(value: number | null) {
  const percent = roundedMatchPercent(value);
  return percent === null ? 'Not scored' : `${percent}%`;
}

export function CandidateSheet({
  term,
  score,
  decision,
  cueLabels,
  onDecision,
  onClose,
}: {
  term: SupportTerm | null;
  score: CandidateClueScore | null;
  decision?: 'fits' | 'maybe' | 'not-this-time';
  cueLabels: string[];
  onDecision: (decision: 'fits' | 'maybe' | 'not-this-time') => void;
  onClose: () => void;
}) {
  const match = score?.complete ? roundedMatchPercent(score.clueMatch) : null;
  const singleChannel = score?.complete && score.usedChannels.length === 1
    ? score.usedChannels[0]
    : null;
  const matchLabel = singleChannel === 'body'
    ? 'body clue match'
    : singleChannel === 'shape'
      ? 'feeling-shape match'
      : 'Clue match';
  const hasReviewedScore = Boolean(score?.usedChannels.length);
  return (
    <SupportSheet open={Boolean(term)} title={term?.label ?? 'Word details'} titleId="alex-candidate-sheet-title" onClose={onClose}>
      {term ? (
        <>
          <div className={styles.termHeading}>
            <span className={styles.roleBadge}>{term.roleLabel}</span>
            {match !== null ? <strong>{match}% {matchLabel}</strong> : null}
          </div>

          {term.role === 'faux-feeling' ? <p className={styles.fauxNotice}>{term.definition}</p> : (
            <p className={styles.termDefinition}>{term.definition}</p>
          )}

          {term.role !== 'faux-feeling' ? (
            <details className={styles.matchDetails} open>
              <summary>Why this match?</summary>
              {score?.usedChannels.length ? (
                <dl>
                  {score.body ? <><dt>Body</dt><dd>{percentLine(score.body.match)} from {score.body.cueCount} {score.body.cueCount === 1 ? 'cue' : 'cues'}{cueLabels.length ? ` · ${cueLabels.join(', ')}` : ''}</dd></> : null}
                  {score.shape ? <><dt>Feeling shape</dt><dd>{percentLine(score.shape.match)} from {score.shape.dimensions.join(', ')}</dd></> : null}
                  {score.complete && score.usedChannels.length > 1 ? <><dt>Clue match</dt><dd>{percentLine(score.clueMatch)} · equal average of {score.usedChannels.length} channels</dd></> : null}
                  {score.missingChannels.length ? <><dt>Coverage</dt><dd>Unscored for one or more of your clues.</dd></> : null}
                </dl>
              ) : <p>Not enough scored clues for a match.</p>}
            </details>
          ) : null}

          {term.role === 'faux-feeling' ? (
            <p className={styles.scoreDisclosure}>Faux Feelings are not scored. You can keep this term if it helps describe your experience.</p>
          ) : hasReviewedScore ? (
            <p className={styles.scoreDisclosure}>Clue match estimates how closely this word’s reviewed profile fits the clues you entered. It is not a probability, diagnosis, or determination of what you feel. You remain the judge.</p>
          ) : (
            <p className={styles.scoreDisclosure}>This word has no reviewed profile for these clues, so it is not scored. You can still decide whether it fits.</p>
          )}

          <div className={styles.decisionButtons} role="group" aria-label={`Does ${term.label} fit?`}>
            <button type="button" aria-pressed={decision === 'fits'} onClick={() => onDecision('fits')}>Fits</button>
            <button type="button" aria-pressed={decision === 'maybe'} onClick={() => onDecision('maybe')}>Maybe</button>
            <button type="button" aria-pressed={decision === 'not-this-time'} onClick={() => onDecision('not-this-time')}>Not this time</button>
          </div>

          <div className={styles.sheetFooterSplit}>
            {term.route ? <Link to={term.route}>Open {term.roleLabel} page</Link> : null}
            {term.definitionSource?.startsWith('https://') ? (
              <a href={term.definitionSource} target="_blank" rel="noopener noreferrer">Definition source</a>
            ) : null}
            <button type="button" className={styles.primaryButton} onClick={onClose}>Done</button>
          </div>
        </>
      ) : null}
    </SupportSheet>
  );
}

export function NeedCatalogSheet({
  open,
  query,
  selected,
  playMode,
  onQueryChange,
  onSelectedChange,
  onPlayModeChange,
  onClose,
}: {
  open: boolean;
  query: string;
  selected: string[];
  playMode: boolean;
  onQueryChange: (query: string) => void;
  onSelectedChange: (slugs: string[]) => void;
  onPlayModeChange: (play: boolean) => void;
  onClose: () => void;
}) {
  const normalized = query.trim().toLocaleLowerCase();
  const visibleNeeds = normalized
    ? needs.filter((need) => need.title.toLocaleLowerCase().includes(normalized))
    : needs;
  const items: MagnetBoardItem[] = visibleNeeds.map((need) => ({
    id: `alex-need-${need.slug}`,
    label: need.title,
    kind: 'need',
    tone: selected.includes(need.slug) ? 'positive' : 'selection',
    iconUrl: assetPath(`icons/needs/${need.slug}.svg`),
    selected: selected.includes(need.slug),
    ariaLabel: `${need.title}${selected.includes(need.slug) ? ', selected' : ''}`,
    onActivate: () => onSelectedChange(selected.includes(need.slug)
      ? selected.filter((slug) => slug !== need.slug)
      : [...selected, need.slug]),
  }));
  return (
    <SupportSheet open={open} title="What are you needing?" titleId="alex-needs-sheet-title" onClose={onClose} wide>
      <p className={styles.sheetIntro}>Choose any Needs that fit. A feeling does not prove a particular Need.</p>
      <label className={styles.sheetSearch}>
        <span className="visually-hidden">Search all needs</span>
        <SearchIcon />
        <input
          type="search"
          value={query}
          placeholder="Search all needs"
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
          data-dialog-initial-focus
        />
      </label>
      <p className={styles.selectedCount} aria-live="polite">{selected.length} {selected.length === 1 ? 'Need' : 'Needs'} selected</p>
      {items.length ? (
        <MagnetBoard
          className={styles.needBoard}
          items={items}
          playMode={playMode}
          onPlayModeChange={onPlayModeChange}
          storageKey={normalized ? `alexithymia-needs:${normalized}` : 'alexithymia-needs'}
          ariaLabel="Need choices"
        />
      ) : <p className={styles.emptyMessage}>No Needs match “{query}”.</p>}
      <div className={styles.sheetFooterSplit}>
        <button type="button" className={styles.textButton} onClick={() => { onSelectedChange([]); onClose(); }}>Not sure yet</button>
        <button type="button" className={styles.primaryButton} onClick={onClose}>Done</button>
      </div>
    </SupportSheet>
  );
}

export function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;
}

export function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

export function InfoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v7M12 7h.01" /></svg>;
}

export function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>;
}

export function BodyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.5" /><path d="M9 10c0-1.7 1.3-3 3-3s3 1.3 3 3v4l2 6M9 10v4l-2 6M9 13h6" /></svg>;
}

export function ShapeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16c2-8 5-10 8-4s5 4 8-4" /><circle cx="4" cy="16" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="20" cy="8" r="1.5" /></svg>;
}
