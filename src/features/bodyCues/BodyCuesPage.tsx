import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import bodyRegionsRaw from '../../data/body-regions.json';
import { IntensitySlider, formatIntensityRating } from '../../components/intensity/IntensitySlider';
import { alexithymiaCandidateByKey, alexithymiaCandidates } from '../alexithymia/alexithymiaData';
import {
  clearBodyCuesDraft,
  readBodyCuesDraft,
  writeBodyCuesDraft,
  readAlexithymiaDraft,
  writeAlexithymiaDraft,
  type BodyCuesDraft,
} from '../../persistence/workflowDrafts';
import { checkInVisit, useCheckInReturnContext, type CheckInLocationState } from '../alexithymia/checkInNavigation';
import { useWorkflowDraftPersistence } from '../../persistence/useWorkflowDraftPersistence';
import { computeBodyCueMatches } from './bodyCueMath';
import styles from './BodyCuesPage.module.css';

type BodyOption = { id: string; title: string; note: string; emotions?: Record<string, number> };
type BodyRegion = { id: string; label: string; prompt: string; options: BodyOption[] };
const bodyRegions = bodyRegionsRaw as unknown as BodyRegion[];

function useMobileResultsLayout() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}

export function BodyCuesPage() {
  const navigate = useNavigate();
  const context = useCheckInReturnContext();
  const [initialDraft] = useState(() => {
    const checkIn = context ? readAlexithymiaDraft() : null;
    return checkIn && checkIn.checkInId === context?.id
      ? checkIn.bodyTool ?? { selected: checkIn.selectedCues, showAll: false } : readBodyCuesDraft();
  });
  const [storageError, setStorageError] = useState('');
  const persist = useCallback((draft: BodyCuesDraft) => {
    if (!context) return writeBodyCuesDraft(draft);
    const checkIn = readAlexithymiaDraft();
    if (!checkIn || checkIn.checkInId !== context.id) throw new Error('The check-in changed in another tab.');
    return writeAlexithymiaDraft({ ...checkIn, bodyTool: draft });
  }, [context]);
  const [selected, setSelected] = useState<Record<string, number>>(() => initialDraft?.selected ?? {});
  const [showAll, setShowAll] = useState(() => initialDraft?.showAll ?? false);
  const [resultsPinned, setResultsPinned] = useState(true);
  const mobileResults = useMobileResultsLayout();
  const draft = useMemo(() => ({ selected, showAll }), [selected, showAll]);
  const draftRef = useWorkflowDraftPersistence(draft, persist, 180, (error) => setStorageError(error ? 'These clues could not be kept. Keep this tool open and check device storage.' : ''));

  const scoringSelections = useMemo(() => bodyRegions.flatMap((region) => region.options
    .map((option) => ({ option, intensity: selected[option.id] ?? 0 }))
    .filter(({ intensity }) => intensity > 0)), [selected]);
  const matches = useMemo(() => {
    const availableCandidates = new Set(alexithymiaCandidates.map((candidate) => candidate.key));
    return computeBodyCueMatches(scoringSelections, 100)
      .filter((match) => availableCandidates.has(match.key));
  }, [scoringSelections]);
  const activeCount = Object.values(selected).filter((value) => value > 0).length;
  const visibleLimit = mobileResults || showAll ? 18 : 5;
  const visibleMatches = matches.slice(0, visibleLimit);
  const shownCount = Math.min(visibleLimit, matches.length);

  function updateCue(id: string, value: number) {
    const next = { selected: { ...selected, [id]: value }, showAll: false };
    setSelected(next.selected);
    setShowAll(false);
    // A browser Back or reference return can happen before the debounce fires.
    // Keep the contextual working copy current without applying it to the check-in.
    if (context) {
      try { persist(next); } catch { setStorageError('These clues could not be kept. Keep this tool open and check device storage.'); }
    }
  }

  function reset() {
    draftRef.current = { selected: {}, showAll: false };
    if (!context) clearBodyCuesDraft();
    else {
      try { persist(draftRef.current); } catch { setStorageError('These clues could not be kept. Keep this tool open and check device storage.'); }
    }
    setSelected({});
    setShowAll(false);
  }

  return (
    <div className={styles.page}>
      {context ? <div className={styles.checkInHandoff}>
        <p>Choose clues here, then apply them to your check-in.</p>
        <button type="button" onClick={() => {
          const checkIn = readAlexithymiaDraft();
          if (!checkIn || checkIn.checkInId !== context.id) { setStorageError('A different check-in was started. Your clues have not replaced it.'); return; }
          try {
            writeAlexithymiaDraft({ ...checkIn, selectedCues: selected, bodyClear: false, bodyTool: { selected, showAll } });
            void navigate('/alexithymia-support', { state: { checkIn: {
              visit: checkInVisit, id: context.id, stage: checkIn.stage, restoreScroll: true,
            } } satisfies CheckInLocationState });
          } catch { setStorageError('The check-in could not be updated. Keep these clues open and check device storage.'); }
        }}>Use these clues in check-in</button>
      </div> : null}
      {storageError ? <p role="alert">{storageError}</p> : null}
      <header className={styles.pageHeader}>
        <h1>Body cues</h1>
        <p>Notice what stands out, then compare possible Feeling words.</p>
      </header>
      <div className={styles.explorer}>
        <section
          className={styles.resultsPanel}
          data-pinned={resultsPinned ? 'true' : 'false'}
          aria-labelledby="possible-words-heading"
        >
          <div className={styles.resultsContent}>
            <header className={styles.resultsHeader}>
              <h2 id="possible-words-heading">Possible words</h2>
              <p aria-live="polite">
                {matches.length
                  ? `${shownCount} strongest clue ${shownCount === 1 ? 'match' : 'matches'} shown`
                  : 'Adjust a cue below to compare possible words.'}
              </p>
            </header>

            <div className={styles.matchShelf} data-empty={visibleMatches.length ? 'false' : 'true'} aria-live="polite">
              {!visibleMatches.length ? (
                <p className={styles.empty}>
                  Start with one cue below. As you adjust its intensity, the strongest word matches will appear here.
                </p>
              ) : null}
              {visibleMatches.map((match, index) => {
                const candidate = alexithymiaCandidateByKey.get(match.key);
                const name = candidate?.display ?? match.key;
                const slug = candidate?.catalogSlug;
                const content = (
                  <>
                    <span className={styles.matchIdentity}>
                      <span className={styles.matchName}>{name}</span>
                      <span className={styles.matchRole}>
                        {candidate?.role === 'feeling' ? 'Feeling' : 'Other emotion word'}
                      </span>
                    </span>
                    <span className={styles.matchPercent}>{Math.round(match.percent)}% clue match</span>
                  </>
                );
                const className = `${styles.match} ${index === 0 ? styles.topMatch : ''}`;
                return slug
                  ? <Link className={className} key={match.key} to={`/feelings/${slug}`}>{content}</Link>
                  : <div className={className} key={match.key}>{content}</div>;
              })}
            </div>

            {!mobileResults && matches.length > 5 ? (
              <button className={styles.resultToggle} type="button" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll}>
                {showAll ? 'Show fewer matches' : `Show ${Math.min(18, matches.length) - 5} more matches`}
              </button>
            ) : null}
          </div>

          <div className={styles.resultActions}>
            <button
              type="button"
              className={styles.pinToggle}
              aria-pressed={resultsPinned}
              aria-label={resultsPinned ? 'Unpin possible words' : 'Pin possible words'}
              title={resultsPinned ? 'Unpin possible words' : 'Pin possible words'}
              onClick={() => setResultsPinned((value) => !value)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 3h6l-1 5 4 4v2H6v-2l4-4-1-5M12 14v7" />
                {!resultsPinned ? <path d="M4 4l16 16" /> : null}
              </svg>
            </button>
            <button type="button" className={styles.reset} onClick={reset} aria-label="Reset all cues">Reset</button>
          </div>
        </section>

        <section className={styles.sliderPanel} aria-labelledby="body-cues-heading">
          <header className={styles.sliderHeader}>
            <h2 id="body-cues-heading">Cue intensity</h2>
            <p className={styles.instructions}>Move a slider above zero when you notice a sensation. Leave other sensations at zero.</p>
            <p className={styles.activeCount}>{activeCount} {activeCount === 1 ? 'cue' : 'cues'} selected</p>
          </header>

          <section className={styles.regions} aria-label="Body cue sliders">
            {bodyRegions.map((region) => (
              <section className={styles.region} key={region.id}>
                <header className={styles.regionHeader}>
                  <h3>{region.label}</h3>
                  <p>{region.prompt}</p>
                </header>
                <div className={styles.options}>
                  {region.options.map((option) => {
                    const value = selected[option.id] ?? 0;
                    return (
                      <div className={styles.cue} key={option.id} data-active={value > 0 ? 'true' : undefined}>
                        <div className={styles.cueHeader}>
                          <h4>{option.title}</h4>
                          <output>{formatIntensityRating(value / 10)}</output>
                        </div>
                        <p className={styles.cueNote}>{option.note}</p>
                        <IntensitySlider
                          label={`${option.title} intensity`}
                          value={value / 10}
                          min={0} max={10} step={0.5}
                          lowLabel="0 · None" middleLabel="5 · Moderate" highLabel="10 · Strong"
                          onChange={(rating) => updateCue(option.id, Math.round(rating * 10))}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </section>
        </section>
      </div>
    </div>
  );
}
