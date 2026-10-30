import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import { DisclosureRow } from '../../components/disclosure/DisclosureRow';
import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import { OverlayShell } from '../../components/overlays/OverlayShell';
import { IntensitySlider, formatIntensityRating } from '../../components/intensity/IntensitySlider';
import { assetPath, needs } from '../../data/catalog';
import type { CandidateClueScore, ShapeSelections } from './alexithymiaMath';
import { roundedMatchPercent } from './alexithymiaMath';
import type { ShapeDimension } from './alexithymiaData';
import type { SupportTerm } from './alexithymiaTerms';
import { ValenceArousalField } from '../journal/ValenceArousalField';
import type { JournalMood } from '../journal/journalRepository';
import { shapeToJournalMood, type OverallMoodChoice } from './shapeCoordinates';
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
  footer?: React.ReactNode;
  toolbar?: React.ReactNode;
  wide?: boolean;
  fillHeight?: boolean;
};

export function SupportSheet({
  open,
  title,
  titleId,
  onClose,
  children,
  footer,
  toolbar,
  wide = false,
  fillHeight = false,
}: SupportSheetProps) {
  return (
    <OverlayShell open={open} variant="sheet" title={title} titleId={titleId} onClose={onClose} wide={wide} footer={footer} toolbar={toolbar} fillHeight={fillHeight}>
      {children}
    </OverlayShell>
  );
}

export function BodyClueSheet({
  open, regions, selected, onRegionChange, onSelectedChange,
  onNothingClear, onClear, onOpenFull, onClose,
}: {
  open: boolean;
  regions: BodyRegion[];
  openRegion: string;
  selected: Record<string, number>;
  onRegionChange: (regionId: string) => void;
  onSelectedChange: (selected: Record<string, number>) => void;
  onNothingClear: () => void;
  onClear: () => void;
  onOpenFull: () => void;
  onClose: () => void;
}) {
  const [areaFilter, setAreaFilter] = useState('all');
  const selectedCount = Object.values(selected).filter((value) => value > 0).length;
  const close = () => { setAreaFilter('all'); onClose(); };
  const displayedRegions = areaFilter === 'all' ? regions : regions.filter((region) => region.id === areaFilter);
  return (
    <SupportSheet open={open} title="Body clues" titleId="alex-body-sheet-title" onClose={close} wide>
      <p className={styles.sheetIntro}>Move the slider for any sensation you notice. Leave the others at zero. All areas are optional.</p>
      <label className={styles.areaChooser}>
        <span>Show body sensations in</span>
        <select aria-label="Body area" value={areaFilter} onChange={(event) => {
          const next = event.currentTarget.value;
          setAreaFilter(next);
          if (next !== 'all') onRegionChange(next);
        }}>
          <option value="all">All areas</option>
          {regions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <div className={styles.bodyViewActions}>
        <span aria-live="polite">{selectedCount} {selectedCount === 1 ? 'cue' : 'cues'} selected</span>
      </div>
      <div className={styles.bodySheetLayout}>
        <div className={styles.bodyAreaContent}>
          {displayedRegions.map((area) => <section key={area.id} className={styles.bodyRegionSheet} aria-labelledby={`alex-region-${area.id}`}>
            <header><h3 id={`alex-region-${area.id}`}>{area.label}</h3><p>{area.prompt}</p></header>
            <div className={styles.bodyOptions}>{area.options.map((option) => {
              const stored = selected[option.id] ?? 0;
              const active = stored > 0;
              return <div key={option.id} className={styles.bodyOption} data-active={active ? 'true' : undefined}>
                <div className={styles.bodyOptionHeading}>
                  <strong>{option.title}</strong>
                  <output>{formatIntensityRating(stored / 10)}</output>
                </div>
                <p className={styles.bodyOptionNote}>{option.note}</p>
                <IntensitySlider
                  label={`${option.title} intensity`}
                  value={stored / 10}
                  min={0} max={10} step={0.5}
                  lowLabel="0 · None" middleLabel="5 · Moderate" highLabel="10 · Strong"
                  onChange={(rating) => {
                    const next = { ...selected };
                    if (rating <= 0) delete next[option.id];
                    else next[option.id] = Math.round(rating * 10);
                    onSelectedChange(next);
                  }}
                />
              </div>;
            })}</div>
          </section>)}
        </div>
      </div>
      <div className={styles.sheetFooterSplit}>
        {selectedCount ? <button type="button" className={styles.textButton} onClick={() => { setAreaFilter('all'); onClear(); }}>Clear body clues</button>
          : <button type="button" className={styles.textButton} onClick={() => { setAreaFilter('all'); onNothingClear(); }}>Nothing clear in my body</button>}
        <button type="button" className={styles.primaryButton} onClick={close}>Done</button>
      </div>
      <details className={styles.separateTool}><summary>Separate Body Cues tool</summary>
        <p>The full tool also compares possible emotion words. You can bring your selections back to this check-in.</p>
        <button type="button" className={styles.helpButton} onClick={onOpenFull}>Open Body Cues</button>
      </details>
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
  {
    dimension: 'power',
    label: 'Ability to influence what happens',
    low: 'Less able to influence this',
    high: 'More able to influence this',
    disclosure: 'This asks whether you feel able to influence or respond to what is happening. It is not asking whether you should be in control.',
  },
  {
    dimension: 'expectedness',
    label: 'Familiar or surprising',
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
  const selectedPosition = positions.indexOf(value ?? -1);
  return (
    <fieldset className={styles.shapeScale} aria-labelledby={`alex-shape-label-${dimension}`}>
      <legend>
        <span id={`alex-shape-label-${dimension}`}>{label}</span>
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
              aria-describedby={`alex-shape-endpoints-${dimension}`}
              value={position}
              checked={value === position}
              onChange={() => onChange(position)}
            />
            <span aria-hidden="true">{index + 1}</span>
          </label>
        ))}
      </div>
      <p className={styles.scaleSelection} aria-live="polite">{value === undefined ? 'No rating selected' : selectedPosition < 0 ? 'Previous rating retained' : `Selected: ${selectedPosition + 1} of 5`}</p>
      <div id={`alex-shape-endpoints-${dimension}`} className={styles.shapeEndpoints}><span>{low}</span>{' '}<span>{high}</span></div>
      <button
        type="button"
        className={styles.notSureButton}
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
  onOverallChange,
  overallMood,
  onClose,
}: {
  open: boolean;
  shape: ShapeSelections;
  overallMood?: OverallMoodChoice;
  onChange: (shape: ShapeSelections) => void;
  onOverallChange: (mood: JournalMood | undefined) => void;
  onClose: () => void;
}) {
  return (
    <SupportSheet open={open} title="Overall feeling" titleId="alex-shape-sheet-title" onClose={onClose} wide
      footer={<div className={styles.pickerActions}><button type="button" className={styles.primaryButton} onClick={onClose}>Done</button></div>}>
      <p className={styles.sheetIntro}>Place a point for pleasantness and energy, or choose another mood option. Skip anything unclear.</p>
      <div className={styles.shapeGroups}>
        <section className={styles.shapeGroup} aria-labelledby="alex-shape-core-title">
          <header>
            <p>Start here</p>
            <h3 id="alex-shape-core-title">General feeling</h3>
            <span>One point supplies both ratings for comparison.</span>
          </header>
          <div className={styles.shapeMap}>
            <ValenceArousalField
              mood={shapeToJournalMood(shape, overallMood)}
              onChange={onOverallChange}
            />
          </div>
        </section>
        <section className={`${styles.shapeGroup} ${styles.shapeGroupSecondary}`} aria-labelledby="alex-shape-context-title">
          <header>
            <p>Optional detail</p>
            <h3 id="alex-shape-context-title">How the situation felt</h3>
            <span>These ratings can make the comparison more specific.</span>
          </header>
          <div className={styles.shapeScales}>
            {shapeControls.map((control) => (
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
    </SupportSheet>
  );
}

function percentLine(value: number | null) {
  const percent = roundedMatchPercent(value);
  return percent === null ? 'Cannot compare' : `${percent}%`;
}

function plainShapeDimension(dimension: string) {
  const labels: Record<string, string> = {
    pleasantness: 'pleasant or unpleasant',
    energy: 'energy',
    power: 'ability to influence what happens',
    expectedness: 'familiar or surprising',
  };
  return labels[dimension] ?? dimension;
}

export function CandidateSheet({
  term,
  score,
  decision,
  intensity,
  cueLabels,
  previewOnly = false,
  onOpenReference,
  onDecision,
  onClose,
}: {
  term: SupportTerm | null;
  score: CandidateClueScore | null;
  decision?: 'fits' | 'maybe' | 'not-this-time';
  intensity?: number;
  cueLabels: string[];
  previewOnly?: boolean;
  onOpenReference: (route: string) => void;
  onDecision: (decision: 'fits' | 'maybe' | 'not-this-time', intensity?: number) => void;
  onClose: () => void;
}) {
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingChoice, setRatingChoice] = useState<number | null>(null);
  const ratingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ratingOpen) return;
    ratingRef.current?.scrollIntoView({ block: 'nearest' });
  }, [ratingOpen]);
  const close = () => { setRatingOpen(false); setRatingChoice(null); onClose(); };
  const decideAndClose = (choice: 'fits' | 'maybe' | 'not-this-time', rating?: number) => {
    onDecision(choice, rating);
    close();
  };
  const match = score?.complete ? roundedMatchPercent(score.clueMatch) : null;
  const singleChannel = score?.complete && score.usedChannels.length === 1
    ? score.usedChannels[0]
    : null;
  const matchLabel = singleChannel === 'body'
    ? 'body clue match'
    : singleChannel === 'shape'
      ? 'overall-feeling match'
      : 'Clue match';
  const hasReviewedScore = Boolean(score?.usedChannels.length);
  return (
    <SupportSheet open={Boolean(term)} title={term?.label ?? 'Word details'} titleId="alex-candidate-sheet-title" onClose={close}>
      {term ? (
        <>
          <div className={styles.termHeading}>
            <span className={styles.roleBadge}>{term.roleLabel}</span>
            {match !== null ? <strong>{match}% {matchLabel}</strong> : null}
          </div>

          {term.role === 'faux-feeling' ? <p className={styles.fauxNotice}>{term.definition}</p> : (
            <p className={styles.termDefinition}>{term.definition}</p>
          )}
          {term.role === 'working' ? <p className={styles.scoreDisclosure}>{term.candidate ? 'This is an emotion word you can use here, but it is not one of the site’s linked Feeling pages.' : 'This is a word you entered for this check-in.'}</p> : null}

          {!previewOnly && term.role !== 'faux-feeling' && term.candidate ? (
            <details className={styles.matchDetails} open>
              <summary>How this was compared</summary>
              {score?.usedChannels.length ? (
                <dl>
                  {score.body ? <><dt>Body clues</dt><dd>{percentLine(score.body.match)} from {score.body.cueCount} {score.body.cueCount === 1 ? 'cue' : 'cues'}{cueLabels.length ? `: ${cueLabels.join(', ')}` : ''}</dd></> : null}
                  {score.shape ? <><dt>Overall feeling</dt><dd>{percentLine(score.shape.match)} from {score.shape.dimensions.map(plainShapeDimension).join(', ')}</dd></> : null}
                  {score.complete && score.usedChannels.length > 1 ? <><dt>Combined result</dt><dd>{percentLine(score.clueMatch)}. The app gives body clues and overall-feeling ratings equal weight.</dd></> : null}
                  {score.missingChannels.length ? <><dt>Some clues unavailable</dt><dd>The app cannot compare every clue you chose for this word.</dd></> : null}
                </dl>
              ) : <p>Choose body clues or at least two overall-feeling ratings to compare this word.</p>}
            </details>
          ) : null}

          {!previewOnly && (term.role === 'faux-feeling' ? (
            <p className={styles.scoreDisclosure}>Faux Feelings are not compared with clues. You can keep this word if it helps describe your experience.</p>
          ) : hasReviewedScore ? (
            <p className={styles.scoreDisclosure}>This percentage shows how closely the word matches the clues you chose. It cannot tell you what you feel; you decide what fits.</p>
          ) : (
            <p className={styles.scoreDisclosure}>{term.candidate ? 'No comparison is available from these clues.' : 'This word is not compared with clues.'} You can still decide whether it fits.</p>
          ))}

          {!previewOnly ? <div className={styles.decisionButtons} role="group" aria-label={`Does ${term.label} fit?`}>
            <button type="button" aria-pressed={decision === 'fits'} onClick={() => {
              if (term.role === 'feeling') { setRatingChoice(intensity ?? null); setRatingOpen(true); }
              else decideAndClose('fits');
            }}><span className={styles.choiceCheck} aria-hidden="true">✓</span>Fits</button>
            <button type="button" aria-pressed={decision === 'maybe'} onClick={() => decideAndClose('maybe')}><span className={styles.choiceCheck} aria-hidden="true">✓</span>Maybe</button>
            <button type="button" aria-pressed={decision === 'not-this-time'} onClick={() => decideAndClose('not-this-time')}><span className={styles.choiceCheck} aria-hidden="true">✓</span>Not this time</button>
          </div> : null}

          {!previewOnly && term.role === 'feeling' && ratingOpen ? (
            <section className={styles.feelingIntensity} aria-label={`Rate ${term.label}`}>
              <div className={styles.feelingIntensityHeading}>
                <strong>How intense is this feeling?</strong>
                <small>{intensity === undefined ? 'Optional · no rating yet' : `Previously rated ${intensity}/10`}</small>
              </div>
              <div ref={ratingRef} className={styles.feelingIntensityScale}>
                <div className={styles.feelingIntensityValue}>
                  <span>Intensity</span>
                  <output>{ratingChoice === null ? 'Not rated' : formatIntensityRating(ratingChoice)}</output>
                </div>
                <IntensitySlider
                  label={`${term.label} intensity`}
                  min={1} max={10} step={1}
                  value={ratingChoice ?? 5}
                  lowLabel="1 · Slight" highLabel="10 · Very strong"
                  onChange={setRatingChoice}
                  valueText={ratingChoice === null ? 'Intensity not selected' : `${ratingChoice} out of 10`}
                />
                <button type="button" className={styles.ratingConfirm} disabled={ratingChoice === null}
                  onClick={() => { if (ratingChoice !== null) decideAndClose('fits', ratingChoice); }}>
                  Use this rating
                </button>
              </div>
              <button type="button" className={styles.intensitySkip} onClick={() => decideAndClose('fits')}>
                Leave intensity unrated
              </button>
            </section>
          ) : null}

          {term.route || term.definitionSource?.startsWith('https://') ? (
            <div className={styles.sheetFooterSplit}>
              {term.route ? <><Link to={term.route} onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault(); onOpenReference(term.route!);
              }}>Open full {term.roleLabel} page</Link><small>Leave these steps; a return action keeps your check-in available.</small></> : null}
              {term.definitionSource?.startsWith('https://') ? (
                <a href={term.definitionSource} target="_blank" rel="noopener noreferrer">Where this definition comes from</a>
              ) : null}
            </div>
          ) : null}
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
  onClear,
  onClose,
}: {
  open: boolean;
  query: string;
  selected: string[];
  playMode: boolean;
  onQueryChange: (query: string) => void;
  onSelectedChange: (slugs: string[]) => void;
  onPlayModeChange: (play: boolean) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const resultsRef = useRef<HTMLDivElement>(null);
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
    <SupportSheet open={open} title="What matters to you here?" titleId="alex-needs-sheet-title" onClose={onClose} wide fillHeight
      footer={<div className={styles.needPickerActions}>
        <p className={styles.selectedCount} aria-live="polite">{selected.length} {selected.length === 1 ? 'Need' : 'Needs'} selected</p>
        {selected.length ? <button type="button" className={styles.pickerClear} aria-label="Clear selected Needs" onClick={onClear}>Clear</button> : null}
        <button type="button" className={styles.primaryButton} onClick={onClose}>Done</button>
      </div>}
      toolbar={<label className={styles.sheetSearch}>
        <span className="visually-hidden">Search all needs</span>
        <SearchIcon />
        <input
          type="search"
          value={query}
          placeholder="Search all needs"
          autoComplete="off"
          onChange={(event) => {
            resultsRef.current?.closest<HTMLElement>('[data-overlay-body]')?.scrollTo({ top: 0 });
            onQueryChange(event.target.value);
          }}
        />
      </label>}>
      <div ref={resultsRef}>
        <DisclosureRow title="About Needs" className={styles.needHelp}>
          <p>A Need is something that matters, such as safety, connection, rest, or understanding. A Feeling can be a clue, but it cannot prove which Need fits.</p>
        </DisclosureRow>
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
