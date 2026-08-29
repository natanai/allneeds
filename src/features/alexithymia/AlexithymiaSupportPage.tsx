import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import bodyRegionsRaw from '../../data/body-regions.json';
import { assetPath, needsBySlug } from '../../data/catalog';
import { analyzeObservation, selectExactObservationEntities } from '../../domain/observationInference';
import {
  clearAlexithymiaDraft,
  readAlexithymiaDraft,
  writeAlexithymiaDraft,
  writeJournalDraft,
} from '../../persistence/workflowDrafts';
import type { AlexithymiaDraft } from '../../persistence/workflowDrafts';
import { readMagnetPlayPreference } from '../../persistence/magnetLayoutStore';
import { useWorkflowDraftPersistence } from '../../persistence/useWorkflowDraftPersistence';
import {
  BackIcon,
  BodyClueSheet,
  BodyIcon,
  CandidateSheet,
  CloseIcon,
  FeelingShapeSheet,
  InfoIcon,
  NeedCatalogSheet,
  SearchIcon,
  ShapeIcon,
  SupportSheet,
  type BodyRegion,
} from './AlexithymiaSupportSheets';
import { alexithymiaCandidates, shapeDimensions } from './alexithymiaData';
import {
  roundedMatchPercent,
  scoreCandidateClues,
  selectedShapeDimensions,
} from './alexithymiaMath';
import {
  buildSupportStatement,
  catalogOnlyTerms,
  createSupportJournalDraft,
  customTermId,
  customWorkingTerm,
  fauxFeelingTerms,
  profileTerms,
  supportTermIndex,
  type SupportTerm,
} from './alexithymiaTerms';
import styles from './AlexithymiaSupportPage.module.css';

type SheetKind = 'info' | 'body' | 'shape' | 'candidate' | 'needs' | null;
type WordFilter = 'matches' | 'all' | 'mine';

const stageSteps = [
  { label: 'What happened', note: 'Name the present moment' },
  { label: 'Clues', note: 'Notice what is available' },
  { label: 'Words', note: 'Compare possibilities' },
  { label: 'Your words', note: 'Choose what fits' },
] as const;

const bodyRegions = bodyRegionsRaw as unknown as BodyRegion[];
const bodyOptionById = new Map(bodyRegions.flatMap((region) => region.options.map((option) => [option.id, {
  ...option,
  regionLabel: region.label,
}])));

function emptyDraft(): AlexithymiaDraft {
  return {
    stage: 0,
    observation: '',
    openRegion: bodyRegions[0]?.id ?? null,
    selectedCues: {},
    bodyClear: false,
    shape: {},
    decisions: {},
    termOrder: [],
    customTerms: [],
    noWordYet: false,
    selectedNeeds: [],
    statement: '',
    statementEdited: false,
  };
}

function shapeClueLabel(dimension: string, value: number) {
  const labels: Record<string, string> = {
    pleasantness: 'Pleasantness',
    energy: 'Energy',
    power: 'Power / control',
    expectedness: 'Expectedness',
  };
  return `${labels[dimension] ?? dimension}: ${Math.round(value * 4) + 1}/5`;
}

function roleTone(term: SupportTerm, decision?: AlexithymiaDraft['decisions'][string]) {
  if (decision === 'fits') return 'positive' as const;
  if (decision === 'maybe') return 'attention' as const;
  if (term.role === 'faux-feeling') return 'quiet' as const;
  return 'selection' as const;
}

function CopyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>;
}

function SpeakIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z" /><path d="M16 9c1.3 1.6 1.3 4.4 0 6M19 6c3.3 3.3 3.3 8.7 0 12" /></svg>;
}

function JournalIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h13a1 1 0 0 1 1 1v17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M8 7h7M8 11h7M8 15h4" /></svg>;
}

function ResetIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4v6h6M5.5 16a8 8 0 1 0 .5-9l-2 3" /></svg>;
}

export function AlexithymiaSupportPage() {
  const navigate = useNavigate();
  const [initialDraft] = useState(() => readAlexithymiaDraft() ?? emptyDraft());
  const [draft, setDraft] = useState<AlexithymiaDraft>(initialDraft);
  const [entryVisible, setEntryVisible] = useState(true);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const [wordFilter, setWordFilter] = useState<WordFilter>('matches');
  const [wordQuery, setWordQuery] = useState('');
  const [needQuery, setNeedQuery] = useState('');
  const [wordPlayMode, setWordPlayMode] = useState(() => readMagnetPlayPreference('alexithymia-words'));
  const [partialPlayMode, setPartialPlayMode] = useState(() => readMagnetPlayPreference('alexithymia-partial-words'));
  const [needPlayMode, setNeedPlayMode] = useState(() => readMagnetPlayPreference('alexithymia-needs'));
  const [status, setStatus] = useState('');
  const draftRef = useWorkflowDraftPersistence(draft, writeAlexithymiaDraft);

  const bodySelections = useMemo(() => Object.entries(draft.selectedCues).flatMap(([id, intensity]) => {
    const option = bodyOptionById.get(id);
    return option && intensity > 0 ? [{ option, intensity }] : [];
  }), [draft.selectedCues]);
  const shapeDimensionList = selectedShapeDimensions(draft.shape);
  const scores = useMemo(
    () => scoreCandidateClues(alexithymiaCandidates, bodySelections, draft.shape),
    [bodySelections, draft.shape],
  );
  const scoreByCandidateKey = useMemo(
    () => new Map(scores.map((score) => [score.key, score])),
    [scores],
  );
  const termIndex = useMemo(() => supportTermIndex(draft.customTerms), [draft.customTerms]);
  const selectedTerms = draft.termOrder
    .map((id) => termIndex.get(id))
    .filter((term): term is SupportTerm => Boolean(term))
    .filter((term) => draft.decisions[term.id] === 'fits' || draft.decisions[term.id] === 'maybe');
  const observationMatches = useMemo(
    () => selectExactObservationEntities(analyzeObservation(draft.observation)),
    [draft.observation],
  );
  const cueLabels = bodySelections.map(({ option }) => option.title);
  const clueTray = [
    ...bodySelections.map(({ option, intensity }) => ({ id: `body:${option.id}`, label: `${option.title} · ${Math.round(intensity)}%` })),
    ...shapeDimensionList.map((dimension) => ({ id: `shape:${dimension}`, label: shapeClueLabel(dimension, draft.shape[dimension] ?? 0) })),
  ];
  const canCompare = bodySelections.length > 0 || shapeDimensionList.length >= 2;

  const completeMatches = profileTerms.map((term) => ({
    term,
    score: scoreByCandidateKey.get(term.candidate!.key)!,
  })).filter(({ score, term }) => (
    score.complete
    && (score.clueMatch ?? 0) > 0
    && draft.decisions[term.id] !== 'not-this-time'
  )).sort((left, right) => (
    (right.score.clueMatch ?? 0) - (left.score.clueMatch ?? 0)
    || left.term.label.localeCompare(right.term.label)
  ));
  const partialMatches = profileTerms.map((term) => ({
    term,
    score: scoreByCandidateKey.get(term.candidate!.key)!,
  })).filter(({ score, term }) => (
    score.usedChannels.length > 0
    && !score.complete
    && draft.decisions[term.id] !== 'not-this-time'
  ));

  const allSearchTerms = useMemo(() => [
    ...profileTerms,
    ...catalogOnlyTerms,
    ...fauxFeelingTerms,
    ...draft.customTerms.map(customWorkingTerm),
  ], [draft.customTerms]);
  const normalizedWordQuery = wordQuery.trim().toLocaleLowerCase();
  const visibleTerms = useMemo(() => {
    if (normalizedWordQuery) {
      return allSearchTerms
        .filter((term) => term.label.toLocaleLowerCase().includes(normalizedWordQuery))
        .sort((left, right) => left.label.localeCompare(right.label));
    }
    if (wordFilter === 'mine') return selectedTerms;
    if (wordFilter === 'all') {
      return [...profileTerms.filter((term) => term.role === 'feeling'), ...catalogOnlyTerms]
        .sort((left, right) => left.label.localeCompare(right.label));
    }
    return completeMatches.map(({ term }) => term);
  }, [allSearchTerms, completeMatches, normalizedWordQuery, selectedTerms, wordFilter]);

  const visibleWordItems: MagnetBoardItem[] = visibleTerms.map((term) => {
    const score = term.candidate ? scoreByCandidateKey.get(term.candidate.key) : null;
    const percent = score?.complete ? roundedMatchPercent(score.clueMatch) : null;
    const decision = draft.decisions[term.id];
    const detail = normalizedWordQuery || wordFilter !== 'matches'
      ? decision === 'fits' ? 'Fits' : decision === 'maybe' ? 'Maybe' : percent === null ? undefined : `${percent}% clue match`
      : percent === null ? undefined : `${percent}% clue match`;
    return {
      id: `alex-word-${term.id}`,
      label: term.label,
      detail,
      badge: term.roleLabel,
      tone: roleTone(term, decision),
      ariaLabel: `${term.label}, ${term.roleLabel}${detail ? `, ${detail}` : ''}`,
      onActivate: () => {
        setActiveTermId(term.id);
        setSheet('candidate');
      },
    };
  });
  const partialWordItems: MagnetBoardItem[] = partialMatches.map(({ term }) => ({
    id: `alex-partial-${term.id}`,
    label: term.label,
    detail: 'Unscored for one or more clues',
    badge: term.roleLabel,
    tone: roleTone(term, draft.decisions[term.id]),
    ariaLabel: `${term.label}, ${term.roleLabel}, unscored for one or more of your clues`,
    onActivate: () => {
      setActiveTermId(term.id);
      setSheet('candidate');
    },
  }));
  const activeTerm = activeTermId ? termIndex.get(activeTermId) ?? null : null;
  const activeScore = activeTerm?.candidate
    ? scoreByCandidateKey.get(activeTerm.candidate.key) ?? null
    : null;
  const exactSearchTerm = normalizedWordQuery
    ? allSearchTerms.find((term) => term.label.toLocaleLowerCase() === normalizedWordQuery)
    : null;
  const selectedNeedItems: MagnetBoardItem[] = draft.selectedNeeds.flatMap((slug) => {
    const need = needsBySlug.get(slug);
    return need ? [{
      id: `alex-selected-need-${slug}`,
      label: need.title,
      detail: 'Open strategies',
      badge: 'Need',
      kind: 'need' as const,
      tone: 'positive' as const,
      iconUrl: assetPath(`icons/needs/${slug}.svg`),
      to: `/needs/${slug}`,
      ariaLabel: `${need.title}, selected Need, open strategies`,
    }] : [];
  });

  function updateDraft(update: (current: AlexithymiaDraft) => AlexithymiaDraft) {
    setDraft((current) => update(current));
  }

  function goToStage(stage: number) {
    setStatus('');
    updateDraft((current) => ({ ...current, stage }));
    setEntryVisible(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function decideTerm(term: SupportTerm, decision: AlexithymiaDraft['decisions'][string]) {
    updateDraft((current) => {
      const decisions = { ...current.decisions, [term.id]: decision };
      const selected = decision === 'fits' || decision === 'maybe';
      const termOrder = selected
        ? current.termOrder.includes(term.id) ? current.termOrder : [...current.termOrder, term.id]
        : current.termOrder.filter((id) => id !== term.id);
      return {
        ...current,
        decisions,
        termOrder,
        noWordYet: selected ? false : current.noWordYet,
      };
    });
  }

  function useCustomWord() {
    const label = wordQuery.trim();
    if (!label) return;
    const id = customTermId(label);
    updateDraft((current) => ({
      ...current,
      customTerms: current.customTerms.some((term) => customTermId(term) === id)
        ? current.customTerms
        : [...current.customTerms, label],
    }));
    setActiveTermId(id);
    window.requestAnimationFrame(() => setSheet('candidate'));
  }

  function chooseNoWordYet() {
    updateDraft((current) => ({
      ...current,
      decisions: Object.fromEntries(Object.entries(current.decisions)
        .filter(([, decision]) => decision === 'not-this-time')),
      termOrder: [],
      noWordYet: true,
    }));
    setStatus('No word yet selected.');
  }

  function moveTerm(id: string, direction: -1 | 1) {
    updateDraft((current) => {
      const index = current.termOrder.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.termOrder.length) return current;
      const termOrder = [...current.termOrder];
      [termOrder[index], termOrder[nextIndex]] = [termOrder[nextIndex]!, termOrder[index]!];
      return { ...current, termOrder };
    });
  }

  function buildSentence() {
    const statement = buildSupportStatement({
      observation: draft.observation,
      terms: selectedTerms,
      needSlugs: draft.selectedNeeds,
      noWordYet: draft.noWordYet,
    });
    updateDraft((current) => ({ ...current, statement, statementEdited: false }));
    setStatus(statement ? 'Sentence built from your selections.' : 'Choose a word, “No word yet,” or a Need first.');
  }

  function addToJournal() {
    writeJournalDraft(createSupportJournalDraft({
      observation: draft.observation,
      terms: selectedTerms,
      needSlugs: draft.selectedNeeds,
      statement: draft.statement,
    }));
    void navigate('/inventory/journal?compose=new');
  }

  function resetCheckIn() {
    if (!window.confirm('Start over and clear this check-in?')) return;
    const next = emptyDraft();
    draftRef.current = next;
    clearAlexithymiaDraft();
    setDraft(next);
    setEntryVisible(true);
    setSheet(null);
    setActiveTermId(null);
    setWordFilter('matches');
    setWordQuery('');
    setNeedQuery('');
    setStatus('');
  }

  const stageTitle = ['What happened?', 'Clues', 'Words', 'Your words'][Math.max(0, draft.stage - 1)] ?? 'Check in';

  if (entryVisible) {
    const hasDraft = draft.stage > 0;
    return (
      <article className={styles.entry} aria-labelledby="alexithymia-title">
        <div className={styles.entryMain}>
          <header>
            <p className={styles.eyebrow}>Alexithymia Support</p>
            <h1 id="alexithymia-title">Find words for right now</h1>
            <p>Use any clues you can notice. The app can compare possible words, but you decide what fits.</p>
          </header>
          <ol className={styles.entryJourney} aria-label="Four check-in steps">
            {stageSteps.map((step, index) => (
              <li key={step.label}>
                <span aria-hidden="true">{index + 1}</span>
                <div><strong>{step.label}</strong><small>{step.note}</small></div>
              </li>
            ))}
          </ol>
          <div className={styles.entryActions}>
            <button type="button" className={styles.primaryButton} onClick={() => {
              if (hasDraft) setEntryVisible(false);
              else goToStage(1);
            }}>
              {hasDraft ? 'Continue check-in' : 'Start check-in'}
            </button>
            <button type="button" className={styles.iconButton} aria-label="About Alexithymia Support" onClick={() => setSheet('info')}><InfoIcon /></button>
          </div>
        </div>
        <aside className={styles.entryAside} aria-label="About this check-in">
          <span className={styles.entryAsideIcon}><InfoIcon /></span>
          <div>
            <strong>You stay in charge</strong>
            <p>This is a support tool, not a test, diagnosis, or therapy. It cannot determine what you feel.</p>
            <a className={styles.methodsLink} href={assetPath('docs/alexithymia-support-methods.md')} target="_blank" rel="noreferrer">Methods &amp; References</a>
          </div>
        </aside>
        <SupportSheet open={sheet === 'info'} title="About this check-in" titleId="alex-info-sheet-title" onClose={() => setSheet(null)}>
          <p>This is a support tool, not a test, diagnosis, or therapy. It cannot determine what you feel.</p>
          <p>You can use any clues that are available, keep more than one possible word, or choose no word yet.</p>
          <a href={assetPath('docs/alexithymia-support-methods.md')} target="_blank" rel="noreferrer">How word comparison works</a>
        </SupportSheet>
      </article>
    );
  }

  return (
    <article className={styles.page} aria-label={`Alexithymia Support: ${stageTitle}`}>
      <header className={styles.appBar}>
        <button type="button" className={styles.iconButton} aria-label="Back" onClick={() => {
          if (draft.stage <= 1) setEntryVisible(true);
          else goToStage(draft.stage - 1);
        }}><BackIcon /></button>
        <div className={styles.appBarCenter}>
          <span className={styles.appBarTitle}><strong>{stageTitle}</strong><small>{draft.stage} of 4</small></span>
          <div className={styles.progress} role="progressbar" aria-label={`${draft.stage} of 4, ${stageTitle}`} aria-valuemin={1} aria-valuemax={4} aria-valuenow={draft.stage}>
            {stageSteps.map((step, index) => (
              <span key={step.label} data-active={index + 1 <= draft.stage ? 'true' : undefined} data-current={index + 1 === draft.stage ? 'true' : undefined}>
                <i aria-hidden="true">{index + 1}</i><small>{step.label}</small>
              </span>
            ))}
          </div>
        </div>
        <button type="button" className={styles.iconButton} aria-label="About this check-in" onClick={() => setSheet('info')}><InfoIcon /></button>
        <button type="button" className={styles.iconButton} aria-label="Close check-in" onClick={() => void navigate('/feelings')}><CloseIcon /></button>
      </header>

      <SupportSheet open={sheet === 'info'} title="About this check-in" titleId="alex-info-sheet-title" onClose={() => setSheet(null)}>
        <p>This is a support tool, not a test, diagnosis, or therapy. It cannot determine what you feel.</p>
        <p>Clue matches compare reviewed word profiles with only the clues you choose. Your judgment remains the final step.</p>
        <a href={assetPath('docs/alexithymia-support-methods.md')} target="_blank" rel="noreferrer">How word comparison works</a>
      </SupportSheet>

      {draft.stage === 1 ? (
        <section className={`${styles.stage} ${styles.stageOne}`} aria-labelledby="alex-stage-one">
          <header className={styles.stageHeader}>
            <p>1 of 4 · What happened?</p>
            <h1 id="alex-stage-one">What are you trying to put into words?</h1>
            <p>If it helps, write one or two observable facts about what just happened.</p>
          </header>
          <div className={styles.observationWorkspace}>
            <div className={styles.observationPrimary}>
              <label className={styles.observationField}>
                <span className="visually-hidden">What happened?</span>
                <textarea
                  rows={7}
                  value={draft.observation}
                  placeholder={'For example: “When we stopped talking after…”'}
                  onChange={(event) => updateDraft((current) => ({ ...current, observation: event.target.value }))}
                  autoFocus
                />
              </label>
              {(observationMatches.feelings.length || observationMatches.needs.length || observationMatches.fauxFeelings.length) ? (
                <section className={styles.detectedTerms} aria-label="Words found in what you wrote">
                  <h2>Words in what you wrote</h2>
                  <p>Linked for reference only. Nothing has been selected or scored.</p>
                  <div>
                    {observationMatches.feelings.map((item) => <Link key={`feeling-${item.slug}`} to={`/feelings/${item.slug}`}>{item.title}<small>Feeling</small></Link>)}
                    {observationMatches.needs.map((item) => <Link key={`need-${item.slug}`} to={`/needs/${item.slug}`}>{item.title}<small>Need</small></Link>)}
                    {observationMatches.fauxFeelings.map((item) => <Link key={`faux-${item.slug}`} to={`/faux-feelings/${item.slug}`}>{item.title}<small>Faux Feeling</small></Link>)}
                  </div>
                </section>
              ) : null}
            </div>
            <aside className={styles.guideRail}>
              <p className={styles.sectionLabel}>A useful starting point</p>
              <strong>Keep it concrete</strong>
              <p>Names, visible actions, or exact words are enough. You can skip this step if nothing is clear.</p>
              <Link to="/observations">Open the Observation helper</Link>
              <div className={styles.stickyActions}>
                <button type="button" className={styles.textButton} onClick={() => {
                  updateDraft((current) => ({ ...current, observation: '' }));
                  goToStage(2);
                }}>Skip</button>
                <button type="button" className={styles.primaryButton} onClick={() => goToStage(2)}>Continue</button>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {draft.stage === 2 ? (
        <section className={`${styles.stage} ${styles.stageClues}`} aria-labelledby="alex-stage-two">
          <header className={styles.stageHeader}>
            <p>2 of 4 · Clues</p>
            <h1 id="alex-stage-two">What can you notice right now?</h1>
            <p>Use any clue that is available. You can skip the rest.</p>
          </header>
          <div className={styles.clueWorkspace}>
            <div className={styles.clueSourceArea}>
              <p className={styles.sectionLabel}>Choose a clue source</p>
              <div className={styles.clueCards}>
                <button type="button" onClick={() => {
                  if (!draft.openRegion) updateDraft((current) => ({ ...current, openRegion: bodyRegions[0]?.id ?? null }));
                  setSheet('body');
                }}>
                  <span className={styles.clueIcon}><BodyIcon /></span>
                  <span><strong>Body clues</strong><small>{draft.bodyClear ? 'Nothing clear right now.' : bodySelections.length ? `${bodySelections.length} ${bodySelections.length === 1 ? 'cue' : 'cues'} selected.` : 'Choose sensations that stand out.'}</small></span>
                  <span className={styles.cardArrow} aria-hidden="true">›</span>
                </button>
                <button type="button" onClick={() => setSheet('shape')}>
                  <span className={styles.clueIcon}><ShapeIcon /></span>
                  <span><strong>Feeling shape</strong><small>{shapeDimensionList.length ? `${shapeDimensionList.length} of 4 parts placed.` : 'Place any parts you can sense.'}</small></span>
                  <span className={styles.cardArrow} aria-hidden="true">›</span>
                </button>
              </div>
              {!canCompare ? <p className={styles.noClueMessage}>Nothing has to be clear yet. You can still browse words or choose “No word yet.”</p> : null}
            </div>
            <aside className={styles.clueSummary}>
              <section className={styles.clueTray} aria-labelledby="your-clues-title">
                <h2 id="your-clues-title">Your clues</h2>
                {clueTray.length ? <div>{clueTray.map((clue) => <span key={clue.id}>{clue.label}</span>)}</div> : <p>No clues selected yet. Start with either source.</p>}
              </section>
              <div className={styles.stickyActions}>
                <button type="button" className={styles.textButton} onClick={() => {
                  setWordFilter('all');
                  goToStage(3);
                }}>Browse words without a match</button>
                <button type="button" className={styles.primaryButton} disabled={!canCompare} onClick={() => {
                  setWordFilter('matches');
                  goToStage(3);
                }}>Compare words</button>
              </div>
            </aside>
          </div>

          <BodyClueSheet
            open={sheet === 'body'}
            regions={bodyRegions}
            openRegion={draft.openRegion ?? bodyRegions[0]?.id ?? ''}
            selected={draft.selectedCues}
            onRegionChange={(openRegion) => updateDraft((current) => ({ ...current, openRegion }))}
            onSelectedChange={(selectedCues) => updateDraft((current) => ({ ...current, selectedCues, bodyClear: false }))}
            onNothingClear={() => {
              updateDraft((current) => ({ ...current, selectedCues: {}, bodyClear: true }));
              setSheet(null);
            }}
            onClose={() => setSheet(null)}
          />
          <FeelingShapeSheet
            open={sheet === 'shape'}
            shape={draft.shape}
            onChange={(shape) => updateDraft((current) => ({ ...current, shape }))}
            onClose={() => setSheet(null)}
          />
        </section>
      ) : null}

      {draft.stage === 3 ? (
        <section className={`${styles.stage} ${styles.stageWords}`} aria-labelledby="alex-stage-three">
          <header className={styles.stageHeader}>
            <p>3 of 4 · Words</p>
            <h1 id="alex-stage-three">Possible words</h1>
            <p>These are clue matches, not answers. More than one may fit—or none yet.</p>
          </header>
          <div className={styles.wordWorkspace}>
            <div className={styles.wordMain}>
              <div className={styles.wordToolbar}>
                <label className={styles.wordSearch}>
                  <SearchIcon />
                  <span className="visually-hidden">Search feelings and working words</span>
                  <input type="search" value={wordQuery} placeholder="Search words" onChange={(event) => setWordQuery(event.target.value)} autoComplete="off" />
                </label>
                <div className={styles.segmented} role="radiogroup" aria-label="Word view">
                  {([['matches', 'Matches'], ['all', 'All feelings'], ['mine', 'My words']] as const).map(([value, label]) => (
                    <button key={value} type="button" role="radio" aria-checked={wordFilter === value} onClick={() => { setWordFilter(value); setWordQuery(''); }}>{label}</button>
                  ))}
                </div>
              </div>

              {visibleWordItems.length ? (
                <MagnetBoard
                  className={styles.wordBoard}
                  items={visibleWordItems}
                  playMode={wordPlayMode}
                  onPlayModeChange={setWordPlayMode}
                  storageKey={`alexithymia-words:${normalizedWordQuery ? 'search' : wordFilter}`}
                  ariaLabel="Possible words"
                />
              ) : (
                <p className={styles.emptyMessage}>{wordFilter === 'mine' ? 'No words selected yet.' : normalizedWordQuery ? `No reviewed words match “${wordQuery}”.` : 'No scored matches yet. Browse all feelings or choose “No word yet.”'}</p>
              )}

              {normalizedWordQuery && !exactSearchTerm ? (
                <button type="button" className={styles.customWordButton} onClick={useCustomWord}>Use “{wordQuery.trim()}” as a working word</button>
              ) : null}

              {!normalizedWordQuery && wordFilter === 'matches' && partialWordItems.length ? (
                <section className={styles.partialWords} aria-labelledby="partial-words-title">
                  <header><h2 id="partial-words-title">More words to consider</h2><p>Unscored for one or more of your clues.</p></header>
                  <MagnetBoard
                    className={styles.wordBoard}
                    items={partialWordItems}
                    playMode={partialPlayMode}
                    onPlayModeChange={setPartialPlayMode}
                    storageKey="alexithymia-partial-words"
                    ariaLabel="Words with incomplete clue coverage"
                  />
                </section>
              ) : null}
            </div>

            <aside className={styles.wordSidebar} aria-label="Your word choices">
              <section className={styles.wordTray} aria-label="Your current words">
                <h2>Your words</h2>
                {selectedTerms.length || draft.noWordYet ? (
                  <div>{selectedTerms.map((term) => <span key={term.id}>{term.label}<small>{draft.decisions[term.id] === 'fits' ? 'Fits' : 'Maybe'}</small></span>)}{draft.noWordYet ? <span>No word yet</span> : null}</div>
                ) : <p>Open a word to mark it Fits or Maybe.</p>}
              </section>
              <div className={styles.wordAlternatives}>
                <p className={styles.sectionLabel}>Other paths</p>
                <button type="button" aria-pressed={draft.noWordYet} onClick={chooseNoWordYet}>No word yet</button>
                <button type="button" onClick={() => { setWordFilter('all'); setWordQuery(''); }}>Browse all feelings</button>
              </div>
              <p className={styles.liveStatus} role="status">{status}</p>
              <div className={styles.stickyActions}>
                <button type="button" className={styles.textButton} onClick={() => goToStage(2)}>Back to clues</button>
                <button type="button" className={styles.primaryButton} disabled={!selectedTerms.length && !draft.noWordYet} onClick={() => goToStage(4)}>Use these words</button>
              </div>
            </aside>
          </div>

          <CandidateSheet
            term={sheet === 'candidate' ? activeTerm : null}
            score={activeScore}
            decision={activeTerm ? draft.decisions[activeTerm.id] : undefined}
            cueLabels={cueLabels}
            onDecision={(decision) => {
              if (activeTerm) decideTerm(activeTerm, decision);
              setStatus(decision === 'not-this-time' ? 'Marked “Not this time” for this check-in.' : `${activeTerm?.label ?? 'Word'} added to Your words.`);
            }}
            onClose={() => setSheet(null)}
          />
        </section>
      ) : null}

      {draft.stage === 4 ? (
        <section className={`${styles.stage} ${styles.stageReview}`} aria-labelledby="alex-stage-four">
          <header className={styles.stageHeader}>
            <p>4 of 4 · Your words</p>
            <h1 id="alex-stage-four">What fits right now?</h1>
          </header>
          <div className={styles.reviewWorkspace}>
            <div className={styles.reviewSelections}>
              <section className={styles.selectionSection} aria-labelledby="selected-feelings-title">
                <header><div><h2 id="selected-feelings-title">Feelings and working words</h2><p>Your choices, not the app’s conclusion.</p></div><button type="button" className={styles.smallAction} onClick={() => goToStage(3)}>Edit</button></header>
                {selectedTerms.length ? (
                  <ol className={styles.selectedTermList}>
                    {selectedTerms.map((term, index) => (
                      <li key={term.id}>
                        <span><strong>{term.label}</strong><small>{term.roleLabel} · {draft.decisions[term.id] === 'fits' ? 'Fits' : 'Maybe'}</small></span>
                        <span className={styles.reorderActions}>
                          <button type="button" disabled={index === 0} aria-label={`Move ${term.label} earlier`} onClick={() => moveTerm(term.id, -1)}>←</button>
                          <button type="button" disabled={index === selectedTerms.length - 1} aria-label={`Move ${term.label} later`} onClick={() => moveTerm(term.id, 1)}>→</button>
                          <button type="button" aria-label={`Remove ${term.label}`} onClick={() => decideTerm(term, 'not-this-time')}><CloseIcon /></button>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : draft.noWordYet ? <p className={styles.noWordSelection}>I’m not sure what I feel yet.</p> : <p className={styles.emptyMessage}>No words selected.</p>}
              </section>

              <section className={styles.selectionSection} aria-labelledby="selected-needs-title">
                <header><div><h2 id="selected-needs-title">What are you needing?</h2><p>Choose any Needs that fit. A feeling does not prove a particular Need.</p></div><button type="button" className={styles.smallAction} onClick={() => setSheet('needs')}>{draft.selectedNeeds.length ? 'Edit Needs' : 'Add Needs'}</button></header>
                {observationMatches.needs.some((need) => !draft.selectedNeeds.includes(need.slug)) ? (
                  <div className={styles.wordsAlreadyUsed}><strong>Words you already used</strong>{observationMatches.needs.filter((need) => !draft.selectedNeeds.includes(need.slug)).map((need) => <button key={need.slug} type="button" onClick={() => updateDraft((current) => ({ ...current, selectedNeeds: [...current.selectedNeeds, need.slug] }))}>{need.title}<span aria-hidden="true">+</span></button>)}</div>
                ) : null}
                {draft.selectedNeeds.length ? (
                  <MagnetBoard
                    className={styles.selectedNeedBoard}
                    items={selectedNeedItems}
                    playMode={needPlayMode}
                    onPlayModeChange={setNeedPlayMode}
                    storageKey="alexithymia-selected-needs"
                    ariaLabel="Selected Needs; open a Need's strategies"
                  />
                ) : <button type="button" className={styles.notSureChoice} onClick={() => setSheet('needs')}>Not sure yet</button>}
              </section>
            </div>

            <div className={styles.reviewOutcome}>
              <section className={styles.composer} aria-labelledby="composer-title">
                <header><h2 id="composer-title">Put it into your words</h2><p>Build from only what you selected, then edit anything.</p></header>
                <button type="button" className={styles.buildButton} onClick={buildSentence}>Build sentence</button>
                <label>
                  <span className="visually-hidden">Your statement</span>
                  <textarea rows={6} value={draft.statement} placeholder="Your words will appear here." onChange={(event) => updateDraft((current) => ({ ...current, statement: event.target.value, statementEdited: true }))} />
                </label>
                <div className={styles.composerActions}>
                  <button type="button" onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(draft.statement);
                      setStatus('Statement copied.');
                    } catch {
                      setStatus('Copy was unavailable. Select the statement to copy it.');
                    }
                  }} disabled={!draft.statement.trim()}><CopyIcon /><span>Copy</span></button>
                  <button type="button" onClick={() => {
                    if (!('speechSynthesis' in window) || !draft.statement.trim()) return;
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(draft.statement));
                    setStatus('Reading your statement aloud.');
                  }} disabled={!draft.statement.trim()}><SpeakIcon /><span>Read aloud</span></button>
                  <button type="button" onClick={addToJournal} disabled={!draft.statement.trim() && !draft.observation.trim() && !selectedTerms.length && !draft.selectedNeeds.length}><JournalIcon /><span>Add to Journal</span></button>
                  <button type="button" onClick={resetCheckIn}><ResetIcon /><span>Start over</span></button>
                </div>
                <p className={styles.liveStatus} role="status">{status}</p>
              </section>
              <p className={styles.completion}>These are your working words for this moment. You can change them whenever more becomes clear.</p>
            </div>
          </div>

          <NeedCatalogSheet
            open={sheet === 'needs'}
            query={needQuery}
            selected={draft.selectedNeeds}
            playMode={needPlayMode}
            onQueryChange={setNeedQuery}
            onSelectedChange={(selectedNeeds) => updateDraft((current) => ({ ...current, selectedNeeds }))}
            onPlayModeChange={setNeedPlayMode}
            onClose={() => setSheet(null)}
          />
        </section>
      ) : null}
    </article>
  );
}
