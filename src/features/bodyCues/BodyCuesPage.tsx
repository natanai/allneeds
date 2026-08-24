import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';

import { loadBodyCueResources, readBodyCueResources } from '../../app/appResources';
import bodyRegionsRaw from '../../data/body-regions.json';
import { feelingsBySlug } from '../../data/catalog';
import {
  clearBodyCuesDraft,
  readBodyCuesDraft,
  writeBodyCuesDraft,
} from '../../persistence/workflowDrafts';
import { useWorkflowDraftPersistence } from '../../persistence/useWorkflowDraftPersistence';
import { computeBodyCueMatches, describeCueIntensity, type ReverseInferenceData } from './bodyCueMath';
import styles from './BodyCuesPage.module.css';

type BodyOption = { id: string; title: string; note: string };
type BodyRegion = { id: string; label: string; prompt: string; options: BodyOption[] };
type EmotionLibrary = Record<string, { name?: string }>;
type ReverseInferenceWithMeta = ReverseInferenceData & {
  _meta?: { slugMap?: Record<string, string> };
};

const bodyRegions = bodyRegionsRaw as BodyRegion[];

function fallbackName(key: string) {
  return key.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function buildFeelingSlugs(slugMap: Record<string, string>) {
  const result = new Map<string, string>();
  Object.entries(slugMap).forEach(([slug, emotionKey]) => {
    if (!result.has(emotionKey) && feelingsBySlug.has(slug)) result.set(emotionKey, slug);
  });
  return result;
}

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
  const initialResources = readBodyCueResources();
  const [initialDraft] = useState(readBodyCuesDraft);
  const [selected, setSelected] = useState<Record<string, number>>(() => initialDraft?.selected ?? {});
  const [reverseInference, setReverseInference] = useState<ReverseInferenceWithMeta | null>(
    () => initialResources?.reverseInference as ReverseInferenceWithMeta | undefined ?? null,
  );
  const [emotionLibrary, setEmotionLibrary] = useState<EmotionLibrary>(
    () => initialResources?.emotionLibrary ?? {},
  );
  const [showAll, setShowAll] = useState(() => initialDraft?.showAll ?? false);
  const [resultsPinned, setResultsPinned] = useState(true);
  const [error, setError] = useState('');
  const mobileResults = useMobileResultsLayout();
  const draft = useMemo(() => ({ selected, showAll }), [selected, showAll]);
  const draftRef = useWorkflowDraftPersistence(draft, writeBodyCuesDraft);

  useEffect(() => {
    let active = true;
    if (reverseInference) return undefined;
    void loadBodyCueResources()
      .then((resources) => {
        if (!active) return;
        setReverseInference(resources.reverseInference as ReverseInferenceWithMeta);
        setEmotionLibrary(resources.emotionLibrary);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'The body-cue data could not be loaded.');
      });
    return () => { active = false; };
  }, [reverseInference]);

  const matches = useMemo(
    () => (reverseInference ? computeBodyCueMatches(reverseInference, selected) : []),
    [reverseInference, selected],
  );
  const feelingSlugs = useMemo(
    () => buildFeelingSlugs(reverseInference?._meta?.slugMap ?? {}),
    [reverseInference],
  );
  const activeCount = Object.values(selected).filter((value) => value > 0).length;
  const visibleLimit = mobileResults || showAll ? 18 : 5;
  const visibleMatches = matches.slice(0, visibleLimit);
  const shownCount = Math.min(visibleLimit, matches.length);

  function updateCue(id: string, value: number) {
    setSelected((current) => ({ ...current, [id]: value }));
    setShowAll(false);
  }

  function reset() {
    draftRef.current = { selected: {}, showAll: false };
    clearBodyCuesDraft();
    setSelected({});
    setShowAll(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.explorer}>
        <section
          className={styles.resultsPanel}
          data-pinned={resultsPinned ? 'true' : 'false'}
          aria-labelledby="possible-feelings-heading"
        >
          <div className={styles.resultsContent}>
            <header className={styles.resultsHeader}>
              <h2 id="possible-feelings-heading">Possible feelings</h2>
              <p aria-live="polite">
                {matches.length
                  ? `${shownCount} strongest ${shownCount === 1 ? 'match' : 'matches'} shown`
                  : 'Adjust a cue below to see possible feelings.'}
              </p>
            </header>

            <div className={styles.matchShelf} data-empty={visibleMatches.length ? 'false' : 'true'} aria-live="polite">
              {error ? <p className={styles.empty} role="alert">{error}</p> : null}
              {!error && !reverseInference ? <p className={styles.empty}>Preparing possible feelings…</p> : null}
              {reverseInference && !visibleMatches.length ? (
                <p className={styles.empty}>
                  Start with one cue below. As you adjust its intensity, the strongest feeling matches will appear here.
                </p>
              ) : null}
              {visibleMatches.map((match, index) => {
                const name = emotionLibrary[match.key]?.name ?? fallbackName(match.key);
                const slug = feelingSlugs.get(match.key);
                const content = (
                  <>
                    <span className={styles.matchName}>{name}</span>
                    <span className={styles.matchPercent}>{Math.round(match.percent)}%</span>
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
              aria-label={resultsPinned ? 'Unpin possible feelings' : 'Pin possible feelings'}
              title={resultsPinned ? 'Unpin possible feelings' : 'Pin possible feelings'}
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
            <h2 id="body-cues-heading">Body cues</h2>
            <p className={styles.instructions}>Move a slider only when a cue fits. Leave everything else off.</p>
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
                    const progressStyle = { '--cue-progress': `${value}%` } as CSSProperties;
                    return (
                      <div className={styles.cue} key={option.id} data-active={value > 0 ? 'true' : undefined}>
                        <div className={styles.cueHeader}>
                          <h4>{option.title}</h4>
                          <output htmlFor={option.id}>{describeCueIntensity(value)}</output>
                        </div>
                        <p className={styles.cueNote}>{option.note}</p>
                        <div className={styles.sliderWrapper}>
                          <input
                            className={styles.slider}
                            style={progressStyle}
                            id={option.id}
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={value}
                            aria-label={`${option.title} intensity`}
                            aria-valuetext={describeCueIntensity(value)}
                            onChange={(event) => updateCue(option.id, Number(event.target.value))}
                          />
                          <span className={styles.scale} aria-hidden="true">
                            <span>Off</span><span>Hint</span><span>Noticeable</span><span>Strong</span>
                          </span>
                        </div>
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
