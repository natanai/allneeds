import { type MouseEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { MagnetBoard } from '../../components/magnets/MagnetBoard';
import type { MagnetBoardItem } from '../../components/magnets/MagnetBoard';
import { OverlayShell } from '../../components/overlays/OverlayShell';
import bodyRegionsRaw from '../../data/body-regions.json';
import { assetPath, needsBySlug } from '../../data/catalog';
import { ALEXITHYMIA_SUPPORT_LABEL } from '../../data/productLanguage';
import { analyzeObservation, selectExactObservationEntities } from '../../domain/observationInference';
import {
  clearAlexithymiaDraft,
  CheckInDraftConflict,
  readAlexithymiaDraft,
  readJournalDraft,
  writeAlexithymiaDraftAgainst,
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
  statementFromDraft,
  supportStatementBasis,
  suggestedNeedsForTerms,
  catalogOnlyTerms,
  customTermId,
  customWorkingTerm,
  fauxFeelingTerms,
  profileTerms,
  supportTermIndex,
  type SupportTerm,
} from './alexithymiaTerms';
import { checkInVisit, type CheckInLocationState } from './checkInNavigation';
import { createCheckInDraft as emptyDraft, journalDraftFromCheckIn } from './checkInDraft';
import { shapeWithJournalMood } from './shapeCoordinates';
import { checkInSteps as stageSteps, CHECK_IN_STAGE_COUNT } from './checkInStages';
import styles from './AlexithymiaSupportPage.module.css';

type SheetKind = 'info' | 'matching' | 'body' | 'shape' | 'candidate' | 'needs' | 'observation' | 'need-preview' | 'replace-statement' | null;
type WordFilter = 'matches' | 'all' | 'mine';

const bodyRegions = bodyRegionsRaw as unknown as BodyRegion[];
const bodyOptionById = new Map(bodyRegions.flatMap((region) => region.options.map((option) => [option.id, {
  ...option,
  regionLabel: region.label,
}])));

function shapeClueLabel(dimension: string, value: number) {
  const labels: Record<string, string> = {
    pleasantness: 'Pleasant or unpleasant',
    energy: 'Energy',
    power: 'Ability to influence what happens',
    expectedness: 'Familiar or surprising',
  };
  return dimension === 'pleasantness' || dimension === 'energy'
    ? `${labels[dimension]}: ${Math.round(value * 10 - 5) > 0 ? '+' : ''}${Math.round(value * 10 - 5)}`
    : `${labels[dimension] ?? dimension}: ${Math.round(value * 4) + 1}/5`;
}

function roleTone(term: SupportTerm, decision?: AlexithymiaDraft['decisions'][string]) {
  if (decision === 'fits') return 'positive' as const;
  if (decision === 'maybe') return 'attention' as const;
  if (term.role === 'faux-feeling') return 'quiet' as const;
  return 'selection' as const;
}

function wordDecisionLabel(decision?: AlexithymiaDraft['decisions'][string]) {
  return decision === 'fits' ? 'Fits' : decision === 'maybe' ? 'Maybe' : decision === 'not-this-time' ? 'Not this time' : undefined;
}

function CopyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>;
}

function SpeakIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z" /><path d="M16 9c1.3 1.6 1.3 4.4 0 6M19 6c3.3 3.3 3.3 8.7 0 12" /></svg>;
}

function StopIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>;
}

function ResetIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4v6h6M5.5 16a8 8 0 1 0 .5-9l-2 3" /></svg>;
}

function keepTextareaFocus(event: MouseEvent<HTMLButtonElement>) {
  if (document.activeElement instanceof HTMLTextAreaElement) event.preventDefault();
}

function MatchingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SupportSheet open={open} title="How matching works" titleId="alex-matching-sheet-title" onClose={onClose}>
      <p><strong>Short version:</strong> the app compares only the clues you choose with fixed descriptions of emotion words. It suggests possibilities; it does not decide what you feel.</p>
      <ol className={styles.entryJourney} aria-label="How matching works">
        <li><span aria-hidden="true">1</span><div><strong>You choose clues</strong><small>Use body sensations, broad overall-feeling ratings, both, or browse without matching.</small></div></li>
        <li><span aria-hidden="true">2</span><div><strong>The app compares fixed profiles</strong><small>Only the clues you chose are compared with reviewed descriptions for each word.</small></div></li>
        <li><span aria-hidden="true">3</span><div><strong>You decide what fits</strong><small>More than one word can fit, or none yet. Fits and Maybe are your choices.</small></div></li>
      </ol>
      <section className={styles.detectedTerms} aria-label="What a match percentage means">
        <h2>A percentage is similarity, not certainty</h2>
        <p><strong>86% match</strong> means that word’s fixed profile is similar to the clues you chose. It does not mean there is an 86% chance that this is what you feel.</p>
      </section>
      <p>Clue-match percentages do not use your observation text. Possibilities brought from Observations are labeled separately; you choose which words and Needs to keep.</p>
      <p>The app does not diagnose anything or send the check-in to a language model.</p>
      <p className={styles.helperLink}><a href={assetPath('docs/alexithymia-support-methods.md')} target="_blank" rel="noreferrer">Full technical methods &amp; sources ↗</a></p>
    </SupportSheet>
  );
}

export function AlexithymiaSupportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as CheckInLocationState | null)?.checkIn;
  const [savedAtEntry] = useState(() => readAlexithymiaDraft());
  const [initialDraft] = useState(() => {
    const saved = savedAtEntry ?? emptyDraft();
    return { ...saved, checkInId: saved.checkInId ?? crypto.randomUUID(),
      statementBasis: saved.statementBasis ?? supportStatementBasis(saved),
      statement: saved.statement.trim() && !saved.statementEdited ? statementFromDraft(saved) : saved.statement,
    };
  });
  const [draft, setDraft] = useState<AlexithymiaDraft>(initialDraft);
  const [entryVisible, setEntryVisible] = useState(!(routeState?.visit === checkInVisit && routeState.id === initialDraft.checkInId));
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const [previewNeed, setPreviewNeed] = useState<string | null>(null);
  const wordFilter: WordFilter = draft.wordFilter ?? 'matches';
  const wordQuery = draft.wordQuery ?? '';
  const needQuery = draft.needQuery ?? '';
  const setWordFilter = (wordFilter: WordFilter) => updateDraft((current) => ({ ...current, wordFilter }));
  const setWordQuery = (wordQuery: string) => updateDraft((current) => ({ ...current, wordQuery }));
  const setNeedQuery = (needQuery: string) => updateDraft((current) => ({ ...current, needQuery }));
  const [wordPlayMode, setWordPlayMode] = useState(() => readMagnetPlayPreference('alexithymia-words'));
  const [partialPlayMode, setPartialPlayMode] = useState(() => readMagnetPlayPreference('alexithymia-partial-words'));
  const [selectedWordPlayMode, setSelectedWordPlayMode] = useState(() => readMagnetPlayPreference('alexithymia-selected-words'));
  const [needPlayMode, setNeedPlayMode] = useState(() => readMagnetPlayPreference('alexithymia-needs'));
  const [suggestedNeedPlayMode, setSuggestedNeedPlayMode] = useState(() => readMagnetPlayPreference('alexithymia-suggested-needs'));
  const [status, setStatus] = useState('');
  const [reading, setReading] = useState(false);
  const readingRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stopReading = useCallback(() => {
    const utterance = readingRef.current;
    if (!utterance) return;
    readingRef.current = null;
    utterance.onend = null;
    utterance.onerror = null;
    setReading(false);
    setStatus('Reading stopped.');
    window.speechSynthesis.cancel();
  }, []);
  useEffect(() => stopReading, [stopReading, draft.statement, draft.stage, entryVisible, location.key]);
  const [storageError, setStorageError] = useState('');
  const [journalConflict, setJournalConflict] = useState(false);
  const [undo, setUndo] = useState<{ draft: AlexithymiaDraft; message: string } | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const expectedStored = useRef(savedAtEntry);
  const persistDraft = useCallback((next: AlexithymiaDraft) => {
    const saved = writeAlexithymiaDraftAgainst(next, expectedStored.current);
    expectedStored.current = saved?.data ?? null;
    return saved;
  }, []);
  const persistenceMessage = (error: unknown) => error instanceof CheckInDraftConflict ? error.message
    : 'This check-in could not be kept on this device. Keep it open and check available storage.';
  const draftRef = useWorkflowDraftPersistence(draft, persistDraft, 180, (error) => {
    setStorageError(error ? persistenceMessage(error) : '');
  });

  useLayoutEffect(() => {
    const state = (location.state as CheckInLocationState | null)?.checkIn;
    setUndo(null);
    setSheet(null);
    if (state?.visit === checkInVisit && state.id === draftRef.current.checkInId) {
      setEntryVisible(false);
      setDraft((current) => current.stage === state.stage ? current : { ...current, stage: state.stage });
    } else setEntryVisible(true);
  }, [location.key, location.state, draftRef]);

  useLayoutEffect(() => {
    if (entryVisible) return;
    const state = (location.state as CheckInLocationState | null)?.checkIn;
    const top = state?.restoreScroll ? draftRef.current.scrollTop ?? 0 : 0;
    const frame = requestAnimationFrame(() => {
      pageRef.current?.scrollTo({ top, behavior: 'instant' });
      if (getComputedStyle(pageRef.current!).position !== 'fixed') window.scrollTo({ top, behavior: 'instant' });
      pageRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [draft.stage, entryVisible, location.key, location.state, draftRef]);

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
  const observationTermIds = new Set(draft.observationSuggestions?.termIds ?? []);
  const observationTerms = [...observationTermIds].flatMap((id) => {
    const term = termIndex.get(id);
    return term && draft.decisions[id] !== 'not-this-time' ? [term] : [];
  });
  const observationSource = draft.observationSuggestions?.text === draft.observation.trim()
    ? 'From your observation' : 'From your earlier observation';
  const observationNeeds = [...new Set([
    ...(draft.observationSuggestions?.needSlugs ?? []),
    ...observationMatches.needs.map((need) => need.slug),
  ])].flatMap((slug) => {
    const need = needsBySlug.get(slug);
    return need && !draft.selectedNeeds.includes(slug) ? [need] : [];
  });
  const cueLabels = bodySelections.map(({ option }) => option.title);
  const clueTray = [
    ...bodySelections.map(({ option, intensity }) => ({ id: `body:${option.id}`, label: `${option.title} · ${Number((intensity / 10).toFixed(1))}/10` })),
    ...shapeDimensionList.map((dimension) => ({ id: `shape:${dimension}`, label: shapeClueLabel(dimension, draft.shape[dimension] ?? 0) })),
    ...(draft.bodyClear ? [{ id: 'body:unclear', label: 'No clear body clues' }] : []),
    ...(draft.overallMood ? [{ id: 'shape:other', label: draft.overallMood === 'mixed' ? 'Mixed feelings' : 'Overall feeling: not sure' }] : []),
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
    const scope = wordFilter === 'mine' ? selectedTerms
      : wordFilter === 'all' ? allSearchTerms : [...new Map([
        ...observationTerms, ...completeMatches.map(({ term }) => term),
      ].map((term) => [term.id, term])).values()];
    return scope.filter((term) => !normalizedWordQuery || term.label.toLocaleLowerCase().includes(normalizedWordQuery))
      .sort((left, right) => wordFilter === 'matches' ? 0 : left.label.localeCompare(right.label));
  }, [allSearchTerms, completeMatches, normalizedWordQuery, selectedTerms, wordFilter, observationTerms]);

  const visibleWordItems: MagnetBoardItem[] = visibleTerms.map((term) => {
    const score = term.candidate ? scoreByCandidateKey.get(term.candidate.key) : null;
    const percent = score?.complete ? roundedMatchPercent(score.clueMatch) : null;
    const decision = draft.decisions[term.id];
    const choice = wordDecisionLabel(decision);
    const context = observationTermIds.has(term.id) ? observationSource : percent === null ? undefined : `${percent}% clue match`;
    const detail = [choice && `${decision === 'fits' ? '✓ ' : ''}${choice}`, context].filter(Boolean).join(' · ') || undefined;
    return {
      id: `alex-word-${term.id}`,
      label: term.label,
      detail,
      badge: term.roleLabel,
      tone: roleTone(term, decision),
      ariaLabel: [term.label, term.roleLabel, choice, context].filter(Boolean).join(', '),
      onActivate: () => {
        setActiveTermId(term.id);
        setSheet('candidate');
      },
    };
  });
  const partialWordItems: MagnetBoardItem[] = partialMatches.filter(({ term }) => !observationTermIds.has(term.id)).map(({ term }) => ({
    id: `alex-partial-${term.id}`,
    label: term.label,
    detail: [draft.decisions[term.id] === 'fits' ? '✓ Fits' : wordDecisionLabel(draft.decisions[term.id]), 'Some clues cannot be compared'].filter(Boolean).join(' · '),
    badge: term.roleLabel,
    tone: roleTone(term, draft.decisions[term.id]),
    ariaLabel: [term.label, term.roleLabel, wordDecisionLabel(draft.decisions[term.id]), 'some clues cannot be compared'].filter(Boolean).join(', '),
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
      detail: 'Open ways to support this Need',
      badge: 'Need',
      kind: 'need' as const,
      tone: 'positive' as const,
      iconUrl: assetPath(`icons/needs/${slug}.svg`),
      onActivate: () => openReference(`/needs/${slug}`),
      ariaLabel: `${need.title}, selected Need, open ways to support it`,
    }] : [];
  });
  const selectedWordItems: MagnetBoardItem[] = selectedTerms.map((term) => {
    const decision = draft.decisions[term.id];
    const intensity = draft.feelingIntensities?.[term.id];
    const detail = decision === 'fits'
      ? `Fits${intensity === undefined ? '' : ` · Intensity ${intensity}/10`}`
      : 'Maybe';
    return {
      id: `alex-selected-word-${term.id}`,
      label: term.label,
      detail,
      badge: term.roleLabel,
      kind: term.role === 'feeling' ? 'feeling' : 'default',
      tone: roleTone(term, decision),
      ...(term.role === 'feeling' && term.catalogSlug
        ? { iconUrl: assetPath(`icons/feelings/${term.catalogSlug}.svg`) } : {}),
      ariaLabel: `${term.label}, ${term.roleLabel}, ${detail}, show description`,
      ariaHasPopup: 'dialog',
      onActivate: () => {
        setActiveTermId(term.id);
        setSheet('candidate');
      },
    };
  });
  const suggestedNeedItems: MagnetBoardItem[] = suggestedNeedsForTerms(selectedTerms, draft.decisions)
    .map(({ need, fromFeelings }) => {
      const selected = draft.selectedNeeds.includes(need.slug);
      const source = `From ${fromFeelings.map((feeling) => feeling.title).join(', ')}`;
      return {
        id: `alex-suggested-need-${need.slug}`,
        label: need.title,
        kind: 'need',
        badge: 'Need',
        detail: source,
        tone: selected ? 'positive' : 'selection',
        selected,
        iconUrl: assetPath(`icons/needs/${need.slug}.svg`),
        ariaLabel: `${need.title}, possible Need, ${source}${selected ? ', selected' : ''}`,
        onActivate: () => toggleNeed(need.slug),
      };
    });

  function toggleNeed(slug: string) {
    updateDraft((current) => ({ ...current, selectedNeeds: current.selectedNeeds.includes(slug)
      ? current.selectedNeeds.filter((value) => value !== slug)
      : [...current.selectedNeeds, slug],
    }));
  }

  function updateDraft(update: (current: AlexithymiaDraft) => AlexithymiaDraft) {
    setUndo(null);
    setDraft((current) => {
      const next = { ...update(current), updatedAt: new Date().toISOString() };
      if (current.statement.trim() && !current.statementEdited && !next.statementEdited
        && supportStatementBasis(current) !== supportStatementBasis(next)) {
        next.statement = statementFromDraft(next);
        next.statementBasis = supportStatementBasis(next);
      }
      return next;
    });
  }

  function clearWithUndo(update: (current: AlexithymiaDraft) => AlexithymiaDraft, message: string) {
    const before = draft;
    updateDraft(update);
    setUndo({ draft: before, message });
  }

  function goToStage(stage: number, restoreScroll = false) {
    setStatus('');
    setJournalConflict(false);
    updateDraft((current) => ({ ...current, stage }));
    setEntryVisible(false);
    void navigate('/alexithymia-support', { state: { checkIn: {
      visit: checkInVisit, id: draft.checkInId!, stage, restoreScroll, previousStage: draft.stage,
    } } satisfies CheckInLocationState });
  }

  function openReference(to: string) {
    const next = { ...draftRef.current, scrollTop: getComputedStyle(pageRef.current!).position === 'fixed'
      ? pageRef.current!.scrollTop : window.scrollY };
    try {
      persistDraft(next);
      draftRef.current = next;
      void navigate(to, { state: { returnToCheckIn: { id: next.checkInId! } } satisfies CheckInLocationState });
    } catch (error) { setStorageError(persistenceMessage(error)); }
  }

  function toggleReadAloud() {
    if (readingRef.current) {
      stopReading();
      return;
    }
    if (typeof window.speechSynthesis?.speak !== 'function' || typeof SpeechSynthesisUtterance !== 'function') {
      setStatus('Read aloud is unavailable in this browser. You can copy your statement instead.');
      return;
    }
    if (!draft.statement.trim()) return;
    try {
      const utterance = new SpeechSynthesisUtterance(draft.statement);
      const finish = (message: string) => {
        if (readingRef.current !== utterance) return;
        readingRef.current = null;
        setReading(false);
        setStatus(message);
      };
      utterance.onend = () => finish('Finished reading your statement.');
      utterance.onerror = (event) => finish(event.error === 'canceled' || event.error === 'interrupted'
        ? 'Reading stopped.' : 'Read aloud could not finish. You can copy your statement instead.');
      window.speechSynthesis.cancel();
      readingRef.current = utterance;
      setReading(true);
      setStatus('Reading your statement aloud.');
      window.speechSynthesis.speak(utterance);
    } catch {
      readingRef.current = null;
      setReading(false);
      setStatus('Read aloud is unavailable in this browser. You can copy your statement instead.');
    }
  }

  function previewWord(route: string) {
    const term = [...termIndex.values()].find((item) => item.route === route);
    if (term) { setActiveTermId(term.id); setSheet('candidate'); }
  }

  function decideTerm(term: SupportTerm, decision: AlexithymiaDraft['decisions'][string], intensity?: number) {
    updateDraft((current) => {
      const decisions = { ...current.decisions, [term.id]: decision };
      const selected = decision === 'fits' || decision === 'maybe';
      const termOrder = selected
        ? current.termOrder.includes(term.id) ? current.termOrder : [...current.termOrder, term.id]
        : current.termOrder.filter((id) => id !== term.id);
      const feelingIntensities = { ...current.feelingIntensities };
      if (decision === 'fits' && term.role === 'feeling' && intensity !== undefined
        && Number.isInteger(intensity) && intensity >= 1 && intensity <= 10) {
        feelingIntensities[term.id] = intensity;
      } else {
        delete feelingIntensities[term.id];
      }
      return {
        ...current,
        decisions,
        termOrder,
        feelingIntensities,
        noWordYet: selected ? false : current.stage === CHECK_IN_STAGE_COUNT && !termOrder.length ? true : current.noWordYet,
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

  function continueToNeeds() {
    updateDraft((current) => ({ ...current, noWordYet: !selectedTerms.length }));
    goToStage(4);
  }

  function buildSentence(replaceEdited = false) {
    if (draft.statementEdited && draft.statement.trim() && !replaceEdited) {
      setSheet('replace-statement');
      return;
    }
    const replace = (current: AlexithymiaDraft) => ({ ...current, statement: statementFromDraft(current),
      statementEdited: false, statementBasis: supportStatementBasis(current),
    });
    if (draft.statement.trim()) clearWithUndo(replace, 'Previous wording replaced.');
    else updateDraft(replace);
    setSheet(null);
    setStatus('Your draft sentence is ready to edit.');
  }

  function addToJournal() {
    if (readJournalDraft()) {
      setJournalConflict(true);
      setStatus('Your Journal has an unfinished page. Open it to save or clear it, then return to this check-in.');
      return;
    }
    try {
      persistDraft(draftRef.current);
      writeJournalDraft(journalDraftFromCheckIn(draftRef.current));
      openReference('/inventory/journal?compose=new');
    } catch (error) { setStorageError(error instanceof CheckInDraftConflict ? error.message : 'The Journal draft could not be saved. Keep this check-in open and check available device storage.'); }

  }

  function resetCheckIn(startImmediately = false) {
    if (draft.stage > 0 && !window.confirm(
      'Start a new check-in? This clears the previous check-in on this device. Saved Journal entries will not change.',
    )) return;
    const next = { ...emptyDraft(), stage: startImmediately ? 1 : 0 };
    try { clearAlexithymiaDraft(); expectedStored.current = null; }
    catch (error) { setStorageError(persistenceMessage(error)); return; }
    draftRef.current = next;
    setDraft(next);
    setEntryVisible(!startImmediately);
    setSheet(null);
    setActiveTermId(null);
    setWordFilter('matches');
    setWordQuery('');
    setNeedQuery('');
    setStatus('');
    setUndo(null);
    setJournalConflict(false);
    void navigate('/alexithymia-support', { replace: true, state: startImmediately ? { checkIn: {
      visit: checkInVisit, id: next.checkInId!, stage: 1,
    } } satisfies CheckInLocationState : null });
  }

  const stageTitle = stageSteps[Math.max(0, draft.stage - 1)]?.label ?? 'Check in';

  if (entryVisible) {
    const hasDraft = draft.stage > 0;
    return (
      <article className={styles.entry} aria-labelledby="alexithymia-title">
        <div className={styles.entryMain}>
          <header>
            <p className={styles.eyebrow}>{ALEXITHYMIA_SUPPORT_LABEL}</p>
            <h1 id="alexithymia-title">Find words for right now</h1>
            <p>Use any clues you can notice. The app can compare possible words, but you decide what fits.</p>
          </header>
          <ol className={styles.entryJourney} aria-label="Five check-in steps">
            {stageSteps.map((step, index) => (
              <li key={step.label}>
                <span aria-hidden="true">{index + 1}</span>
                <div><strong>{step.label}</strong><small>{step.note}</small></div>
              </li>
            ))}
          </ol>
          {hasDraft ? (
            <p className={styles.savedCheckInNote}>A previous check-in is saved on this device{draft.updatedAt ? ` · ${new Date(draft.updatedAt).toLocaleString()}` : ''}. Continue at {stageSteps[Math.max(0, draft.stage - 1)]?.label ?? 'your last step'}, or begin fresh.</p>
          ) : null}
          <div className={styles.entryActions}>
            <button type="button" className={styles.primaryButton} onClick={() => {
              if (hasDraft) resetCheckIn(true);
              else goToStage(1);
            }}>
              {hasDraft ? 'Start new check-in' : 'Start check-in'}
            </button>
            {hasDraft ? (
              <button type="button" className={styles.textButton} onClick={() => goToStage(draft.stage, true)}>
                Continue previous check-in
              </button>
            ) : null}
            <button type="button" className={styles.iconButton} aria-label="About this feeling check-in" onClick={() => setSheet('info')}><InfoIcon /></button>
          </div>
        </div>
        <SupportSheet open={sheet === 'info'} title="About this check-in" titleId="alex-info-sheet-title" onClose={() => setSheet(null)}>
          <p>Alexithymia means having difficulty identifying or describing feelings. You do not need that label or a diagnosis to use this page.</p>
          <p>This is a support tool, not a test, diagnosis, or therapy. It cannot determine what you feel.</p>
          <p>You can use any clues that are available, keep more than one possible word, or choose no word yet.</p>
          <p className={styles.helperLink}><a href="#matching-explanation" aria-haspopup="dialog" onClick={(event) => { event.preventDefault(); setSheet('matching'); }}>How matching works</a></p>
        </SupportSheet>
        <MatchingSheet open={sheet === 'matching'} onClose={() => setSheet(null)} />
      </article>
    );
  }

  return (
    <article ref={pageRef} className={styles.page} aria-label={`${ALEXITHYMIA_SUPPORT_LABEL}: ${stageTitle}`}>
      <header className={styles.appBar}>
        <button type="button" className={styles.iconButton} aria-label="Back" onClick={() => {
          if (draft.stage <= 1) void navigate('/alexithymia-support', { state: null });
          else if (routeState?.previousStage === draft.stage - 1) void navigate(-1);
          else goToStage(draft.stage - 1);
        }}><BackIcon /></button>
        <div className={styles.appBarCenter}>
          <span className={styles.appBarTitle}><strong>{stageTitle}</strong><small>{draft.stage} of {CHECK_IN_STAGE_COUNT}</small></span>
          <div className={styles.progress} role="progressbar" aria-label={`${draft.stage} of ${CHECK_IN_STAGE_COUNT}, ${stageTitle}`} aria-valuemin={1} aria-valuemax={CHECK_IN_STAGE_COUNT} aria-valuenow={draft.stage}>
            {stageSteps.map((step, index) => (
              <span key={step.label} data-active={index + 1 <= draft.stage ? 'true' : undefined} data-current={index + 1 === draft.stage ? 'true' : undefined}>
                <i aria-hidden="true">{index + 1}</i><small>{step.label}</small>
              </span>
            ))}
          </div>
        </div>
        <button type="button" className={styles.iconButton} aria-label="About this check-in" onClick={() => setSheet('info')}><InfoIcon /></button>
        <button type="button" className={styles.iconButton} aria-label="Close check-in" onClick={() => openReference('/feelings')}><CloseIcon /></button>
      </header>

      {storageError ? <p className={styles.notice} role="alert">{storageError}</p> : null}
      {undo ? <div className={styles.notice} role="status"><span>{undo.message}</span><button type="button" onClick={() => {
        const previous = undo.draft; updateDraft(() => previous); setStatus('Previous choices restored.');
      }}>Undo</button></div> : null}
      <SupportSheet open={sheet === 'info'} title="About this check-in" titleId="alex-info-sheet-title" onClose={() => setSheet(null)}>
        <p>Alexithymia means having difficulty identifying or describing feelings. You do not need that label or a diagnosis to use this page.</p>
        <p>This is a support tool, not a test, diagnosis, or therapy. It cannot determine what you feel.</p>
        <p>The app compares the clues you choose with general descriptions of emotion words. It cannot know what you feel; you decide what fits.</p>
        <p className={styles.helperLink}><a href="#matching-explanation" aria-haspopup="dialog" onClick={(event) => { event.preventDefault(); setSheet('matching'); }}>How matching works</a></p>
      </SupportSheet>
      <MatchingSheet open={sheet === 'matching'} onClose={() => setSheet(null)} />

      {draft.stage === 1 ? (
        <section className={`${styles.stage} ${styles.stageOne}`} aria-labelledby="alex-stage-one">
          <header className={styles.stageHeader}>
            <p>1 of 5 · What happened?</p>
            <h1 tabIndex={-1} id="alex-stage-one">What are you trying to put into words?</h1>
            <p>If it helps, write one or two details someone could have seen or heard, such as what happened or the exact words used.</p>
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
                />
              </label>
              {draft.observation.trim() ? <button type="button" className={styles.textButton} onMouseDown={keepTextareaFocus} onClick={() => clearWithUndo(
                (current) => ({ ...current, observation: '' }), 'Observation cleared.',
              )}>Clear observation</button> : null}
              {(observationMatches.feelings.length || observationMatches.needs.length || observationMatches.fauxFeelings.length) ? (
                <section className={styles.detectedTerms} aria-label="Words found in what you wrote">
                  <h2>Words in what you wrote</h2>
                  <p>Open a recognized word to learn more. The app has not chosen it for you.</p>
                  <div>
                    {observationMatches.feelings.map((item) => <button type="button" key={`feeling-${item.slug}`} onMouseDown={keepTextareaFocus} onClick={() => previewWord(`/feelings/${item.slug}`)}>{item.title}<small>Feeling</small></button>)}
                    {observationMatches.needs.map((item) => <button type="button" key={`need-${item.slug}`} onMouseDown={keepTextareaFocus} onClick={() => { setPreviewNeed(item.slug); setSheet('need-preview'); }}>{item.title}<small>Need</small></button>)}
                    {observationMatches.fauxFeelings.map((item) => <button type="button" key={`faux-${item.slug}`} onMouseDown={keepTextareaFocus} onClick={() => previewWord(`/faux-feelings/${item.slug}`)}>{item.title}<small>Faux Feeling</small></button>)}
                  </div>
                  {observationMatches.needs.length ? <p>A Need means something that matters, such as rest, safety, connection, or understanding.</p> : null}
                  {observationMatches.fauxFeelings.length ? <p>A Faux Feeling may combine an emotion with an interpretation of what happened. The label does not mean the event was unreal.</p> : null}
                </section>
              ) : null}
            </div>
            <aside className={styles.guideRail}>
              <button type="button" className={styles.helpButton} onMouseDown={keepTextareaFocus} onClick={() => setSheet('observation')}>Get help describing what happened</button>
              <div className={styles.stickyActions}>
                <button type="button" className={styles.textButton} onClick={() => {
                  goToStage(2);
                }} onMouseDown={keepTextareaFocus}>Skip</button>
                <button type="button" className={styles.primaryButton} onMouseDown={keepTextareaFocus} onClick={() => goToStage(2)}>Continue</button>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {draft.stage === 2 ? (
        <section className={`${styles.stage} ${styles.stageClues}`} aria-labelledby="alex-stage-two">
          <header className={styles.stageHeader}>
            <p>2 of 5 · Clues</p>
            <h1 tabIndex={-1} id="alex-stage-two">What can you notice right now?</h1>
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
                  <span><strong>Overall feeling</strong><small>{draft.overallMood ? (draft.overallMood === 'mixed' ? 'Mixed feelings selected.' : 'Not sure selected.') : shapeDimensionList.length ? `${shapeDimensionList.length} of 4 ratings chosen.` : 'Rate pleasantness and energy.'}</small></span>
                  <span className={styles.cardArrow} aria-hidden="true">›</span>
                </button>
              </div>
              {!canCompare ? <p className={styles.noClueMessage}>You can continue without clear clues or a feeling word.</p> : null}
            </div>
            <aside className={styles.clueSummary}>
              <section className={styles.clueTray} aria-labelledby="your-clues-title">
                <h2 id="your-clues-title">Your clues</h2>
                {clueTray.length ? <div>{clueTray.map((clue) => <span key={clue.id}>{clue.label}</span>)}</div> : <p>No clues selected yet. Start with either source.</p>}
              </section>
              <div className={styles.stickyActions}>
                <button type="button" className={styles.primaryButton} onClick={() => {
                  setWordFilter(canCompare || observationTerms.length ? 'matches' : 'all');
                  goToStage(3);
                }}>Continue to words</button>
              </div>
            </aside>
          </div>

          <BodyClueSheet
            open={sheet === 'body'}
            regions={bodyRegions}
            openRegion={draft.openRegion ?? bodyRegions[0]?.id ?? ''}
            selected={draft.selectedCues}
            onRegionChange={(openRegion) => updateDraft((current) => ({ ...current, openRegion }))}
            onSelectedChange={(selectedCues) => updateDraft((current) => ({ ...current, selectedCues, bodyClear: false, bodyTool: undefined }))}
            onClear={() => {
              clearWithUndo((current) => ({ ...current, selectedCues: {}, bodyClear: false, bodyTool: undefined }), 'Body clues cleared.');
              setSheet(null);
            }}
            onOpenFull={() => openReference('/feelings/body-cues')}
            onNothingClear={() => {
              updateDraft((current) => ({ ...current, selectedCues: {}, bodyClear: true, bodyTool: undefined }));
              setSheet(null);
            }}
            onClose={() => setSheet(null)}
          />
          <FeelingShapeSheet
            open={sheet === 'shape'}
            shape={draft.shape}
            overallMood={draft.overallMood}
            onChange={(shape) => updateDraft((current) => ({ ...current, shape }))}
            onOverallChange={(mood) => updateDraft((current) => ({
              ...current,
              shape: shapeWithJournalMood(current.shape, mood),
              overallMood: mood?.kind === 'mixed' || mood?.kind === 'unsure' ? mood.kind : undefined,
            }))}
            onClose={() => setSheet(null)}
          />
        </section>
      ) : null}

      {draft.stage === 3 ? (
        <section className={`${styles.stage} ${styles.stageWords}`} aria-labelledby="alex-stage-three">
          <header className={styles.stageHeader}>
            <p>3 of 5 · Words</p>
            <h1 tabIndex={-1} id="alex-stage-three">Possible words</h1>
            <p>{draft.observationSuggestions
              ? `These are possibilities from your ${draft.observationSuggestions.text === draft.observation.trim() ? 'observation' : 'earlier observation'} and any clues you chose. More than one may fit, or none yet.`
              : 'These are words to consider, not answers. More than one may fit, or none yet.'}</p>
          </header>
          <div className={styles.wordWorkspace}>
            <div className={styles.wordMain}>
              <div className={styles.wordToolbar}>
                <label className={styles.wordSearch}>
                  <SearchIcon />
                  <span className="visually-hidden">Search feelings and other emotion words</span>
                  <input type="search" value={wordQuery} placeholder="Search words" onChange={(event) => setWordQuery(event.target.value)} autoComplete="off" />
                </label>
                <div className={styles.segmented} role="radiogroup" aria-label="Word view">
                  {([['matches', 'Matches'], ['all', 'All words'], ['mine', 'My words']] as const).map(([value, label]) => (
                    <button key={value} type="button" role="radio" aria-checked={wordFilter === value} tabIndex={wordFilter === value ? 0 : -1} onKeyDown={(event) => {
                      const values: WordFilter[] = ['matches', 'all', 'mine'];
                      const index = values.indexOf(value);
                      const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % 3
                        : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + 2) % 3
                          : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
                      if (next === null) return;
                      event.preventDefault(); setWordFilter(values[next]!); setWordQuery('');
                      (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
                    }} onClick={() => { setWordFilter(value); setWordQuery(''); }}>{label}</button>
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
                <p className={styles.emptyMessage}>{normalizedWordQuery ? `No words in this view match “${wordQuery}”. Try All words, or keep your own word.` : wordFilter === 'mine' ? 'No words selected yet. You can continue without a word.' : 'No matching words to show. Try All words, or continue without a word.'}</p>
              )}

              {normalizedWordQuery && !exactSearchTerm ? (
                <button type="button" className={styles.customWordButton} onClick={useCustomWord}>Use “{wordQuery.trim()}” as my word</button>
              ) : null}

              {!normalizedWordQuery && wordFilter === 'matches' && partialWordItems.length ? (
                <section className={styles.partialWords} aria-labelledby="partial-words-title">
                  <header><h2 id="partial-words-title">More words to consider</h2><p>These words fit some clues, but the app cannot compare every clue you chose.</p></header>
                  <MagnetBoard
                    className={styles.wordBoard}
                    items={partialWordItems}
                    playMode={partialPlayMode}
                    onPlayModeChange={setPartialPlayMode}
                    storageKey="alexithymia-partial-words"
                    ariaLabel="Words that cannot be compared with every clue"
                  />
                </section>
              ) : null}
            </div>

            <aside className={styles.wordSidebar} aria-label="Your word choices">
              <section className={styles.wordTray} aria-label="Your current words">
                <h2>Your words</h2>
                {selectedTerms.length || draft.noWordYet ? (
                  <div>{selectedTerms.map((term) => <span key={term.id}>{term.label}<small>{draft.decisions[term.id] === 'fits' ? `Fits${draft.feelingIntensities?.[term.id] ? ` · ${draft.feelingIntensities[term.id]}/10` : ''}` : 'Maybe'}</small></span>)}{draft.noWordYet ? <span>No word yet</span> : null}</div>
                ) : <p>Open a word to mark it Fits or Maybe.</p>}
              </section>
              {selectedTerms.length ? <button type="button" className={styles.textButton} onClick={() => clearWithUndo((current) => ({
                ...current, decisions: Object.fromEntries(Object.entries(current.decisions).filter(([, decision]) => decision === 'not-this-time')),
                termOrder: [], feelingIntensities: {}, noWordYet: false,
              }), 'Selected words cleared.')}>Clear selected words</button> : <p className={styles.noClueMessage}>A feeling word is optional.</p>}
              <p className={styles.liveStatus} role="status">{status}</p>
              <div className={styles.stickyActions}>
                <button type="button" className={styles.textButton} onClick={() => goToStage(2)}>Back to clues</button>
                <button type="button" className={styles.primaryButton} onClick={continueToNeeds}>{selectedTerms.length ? 'Continue' : 'Continue without a word'}</button>
              </div>
            </aside>
          </div>


        </section>
      ) : null}

      {draft.stage === 4 ? (
        <section className={`${styles.stage} ${styles.stageNeeds}`} aria-labelledby="alex-stage-four">
          <header className={styles.stageHeader}>
            <p>4 of 5 · Needs</p>
            <h1 tabIndex={-1} id="alex-stage-four">What matters to you here?</h1>
            <p>Choose any Needs that fit. You can add others or skip this step.</p>
          </header>
          <div className={styles.needWorkspace}>
            <div className={styles.needMain}>
              <section className={styles.selectionSection} aria-labelledby="possible-needs-title">
                <header><div><h2 id="possible-needs-title">Possible Needs</h2><p>From the Feelings you marked Fits. You decide which Needs matter here.</p></div><button type="button" className={styles.smallAction} onClick={() => setSheet('needs')}>Add Needs</button></header>
                {suggestedNeedItems.length ? <MagnetBoard
                  className={styles.suggestedNeedBoard}
                  items={suggestedNeedItems}
                  playMode={suggestedNeedPlayMode}
                  onPlayModeChange={setSuggestedNeedPlayMode}
                  storageKey="alexithymia-suggested-needs"
                  ariaLabel="Possible Needs from your Feelings"
                /> : <p className={styles.emptyMessage}>No Need suggestions from these choices. You can still browse all Needs.</p>}
              </section>
              {observationNeeds.length ? (
                <div className={styles.wordsAlreadyUsed} aria-label="Needs from your observation"><strong>{draft.observationSuggestions ? observationSource : 'Words you already used'}</strong>{observationNeeds.map((need) => <button key={need.slug} type="button" aria-label={`Add ${need.title}`} onClick={() => toggleNeed(need.slug)}>{need.title}<span aria-hidden="true">+</span></button>)}</div>
              ) : null}
            </div>
            <aside className={styles.needSidebar} aria-label="Your Need choices">
              <section className={styles.selectionSection} aria-labelledby="chosen-needs-title">
                <header><h2 id="chosen-needs-title">Your Needs</h2><span className={styles.selectedCount} aria-live="polite">{draft.selectedNeeds.length} selected</span></header>
                {draft.selectedNeeds.length ? <>
                  <ul className={styles.chosenNeedList}>
                    {draft.selectedNeeds.flatMap((slug) => {
                      const need = needsBySlug.get(slug);
                      return need ? <li key={slug}><span>{need.title}</span><button type="button" className={styles.iconButton} aria-label={`Remove ${need.title}`} onClick={() => toggleNeed(slug)}><CloseIcon /></button></li> : [];
                    })}
                  </ul>
                  <button type="button" className={styles.textButton} onClick={() => clearWithUndo((current) => ({ ...current, selectedNeeds: [] }), 'Selected Needs cleared.')}>Clear selected Needs</button>
                </> : <p className={styles.emptyMessage}>No Needs selected.</p>}
              </section>
              <div className={styles.stickyActions}>
                <button type="button" className={styles.textButton} onClick={() => goToStage(5)}>Skip</button>
                <button type="button" className={styles.primaryButton} aria-label="Continue to your words" onClick={() => goToStage(5)}>Continue</button>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {draft.stage === 5 ? (
        <section className={`${styles.stage} ${styles.stageReview}`} aria-labelledby="alex-stage-five">
          <header className={styles.stageHeader}>
            <p>5 of 5 · Your words</p>
            <h1 tabIndex={-1} id="alex-stage-five">Your check-in</h1>
            <p>Review your choices, then put them into your words.</p>
          </header>
          <div className={styles.reviewWorkspace}>
            <div className={styles.reviewSelections}>
              <section className={styles.selectionSection} aria-labelledby="selected-feelings-title">
                <header><h2 id="selected-feelings-title">Your feeling words</h2><button type="button" className={styles.editChoiceButton} onClick={() => goToStage(3)}>Edit feelings</button></header>
                {selectedTerms.length ? (
                  <MagnetBoard
                    className={styles.recapBoard}
                    items={selectedWordItems}
                    playMode={selectedWordPlayMode}
                    onPlayModeChange={setSelectedWordPlayMode}
                    storageKey="alexithymia-selected-words"
                    ariaLabel="Selected feeling words; show descriptions"
                  />
                ) : draft.noWordYet ? <p className={styles.noWordSelection}>I’m not sure what I feel yet.</p> : <p className={styles.emptyMessage}>No words selected.</p>}
              </section>

              <section className={styles.selectionSection} aria-labelledby="selected-needs-title">
                <header><h2 id="selected-needs-title">Your Needs</h2><button type="button" className={styles.editChoiceButton} onClick={() => goToStage(4)}>Edit Needs</button></header>
                {draft.selectedNeeds.length ? (
                  <MagnetBoard
                    className={styles.recapBoard}
                    items={selectedNeedItems}
                    playMode={needPlayMode}
                    onPlayModeChange={setNeedPlayMode}
                    storageKey="alexithymia-selected-needs"
                    ariaLabel="Selected Needs; open ways to support a Need"
                  />
                ) : <p className={styles.emptyMessage}>No Needs selected. You can continue without choosing one.</p>}
              </section>
            </div>

            <div className={styles.reviewOutcome}>
              <section className={styles.composer} aria-labelledby="composer-title">
                <header><h2 id="composer-title">Put it into your words</h2><p>Start with the words you chose, then edit the sentence however you want.</p></header>
                <button type="button" className={styles.buildButton} onClick={() => buildSentence()}>{draft.statement.trim() ? 'Update draft' : 'Build sentence'}</button>
                <label>
                  <span className="visually-hidden">Your statement</span>
                  <textarea rows={6} value={draft.statement} placeholder="Your words will appear here." onChange={(event) => updateDraft((current) => ({ ...current, statement: event.target.value, statementEdited: true, statementBasis: supportStatementBasis(current) }))} />
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
                  <button type="button" onClick={toggleReadAloud} disabled={!reading && !draft.statement.trim()}>{reading ? <StopIcon /> : <SpeakIcon />}<span>{reading ? 'Stop reading' : 'Read aloud'}</span></button>
                  <button type="button" onClick={() => resetCheckIn()}><ResetIcon /><span>Start over</span></button>
                </div>
                {draft.statementEdited && draft.statementBasis && draft.statementBasis !== supportStatementBasis(draft) ? <p className={styles.notice}>Your choices changed. Your wording is kept; you can update the draft or keep your own statement.</p> : null}
                <p className={styles.helperLink}>Journal opens a draft for you to review and save.</p>
                {journalConflict ? <button type="button" className={styles.primaryButton} onClick={() => openReference('/inventory/journal?compose=new')}>Open unfinished Journal</button> : null}
                <p className={styles.liveStatus} role="status">{status}</p>
                <div className={styles.stickyActions}>
                  <button type="button" className={styles.primaryButton} onClick={addToJournal} disabled={!draft.statement.trim() && !draft.observation.trim() && !selectedTerms.length && !draft.selectedNeeds.length && !bodySelections.length && !draft.bodyClear && !draft.noWordYet && !draft.overallMood && !shapeDimensionList.length}>Continue in Journal</button>
                </div>
              </section>
              <p className={styles.completion}>These are the words that fit for this moment. You can change them whenever more becomes clear.</p>
            </div>
          </div>


        </section>
      ) : null}
          <CandidateSheet
            previewOnly={draft.stage !== 3}
            onOpenReference={openReference}
            term={sheet === 'candidate' ? activeTerm : null}
            score={activeScore}
            decision={activeTerm ? draft.decisions[activeTerm.id] : undefined}
            intensity={activeTerm ? draft.feelingIntensities?.[activeTerm.id] : undefined}
            cueLabels={cueLabels}
            onDecision={(decision, intensity) => {
              if (activeTerm) decideTerm(activeTerm, decision, intensity);
              setStatus(decision === 'not-this-time'
                ? 'Marked “Not this time” for this check-in.'
                : `${activeTerm?.label ?? 'Word'} added to Your words${intensity === undefined ? '' : ` · intensity ${intensity}/10`}.`);
            }}
            onClose={() => setSheet(null)}
          />
          <NeedCatalogSheet
            open={sheet === 'needs'}
            query={needQuery}
            selected={draft.selectedNeeds}
            playMode={needPlayMode}
            onQueryChange={setNeedQuery}
            onSelectedChange={(selectedNeeds) => updateDraft((current) => ({ ...current, selectedNeeds }))}
            onPlayModeChange={setNeedPlayMode}
            onClear={() => {
              clearWithUndo((current) => ({ ...current, selectedNeeds: [] }), 'Selected Needs cleared.');
              setSheet(null);
            }}
            onClose={() => setSheet(null)}
          />
      <OverlayShell open={sheet === 'observation'} variant="dialog" title="Writing tips" titleId="alex-observation-help" onClose={() => setSheet(null)} closeInitialFocus>
        <div className={styles.observationHelp}>
          <p>Describe a visible action or the words you heard. Your own feelings can stay in the text too.</p>
          <p><strong>For example:</strong> “They closed the laptop.”</p>
          <div className={styles.observationReference}>
            <Link to="/observations" aria-describedby="alex-observation-reference-note" onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              openReference('/observations');
            }}>Observations guide</Link>
            <small id="alex-observation-reference-note">Leaves check-in</small>
          </div>
        </div>
      </OverlayShell>
      <SupportSheet open={sheet === 'need-preview'} title={needsBySlug.get(previewNeed ?? '')?.title ?? 'Need'} titleId="alex-need-preview" onClose={() => setSheet(null)}>
        <p>{needsBySlug.get(previewNeed ?? '')?.summary}</p>
        <p className={styles.helperLink}>The full Need page has its evidence and ways to support it. You can return to this check-in.</p>
        <button type="button" className={styles.textButton} onClick={() => openReference(`/needs/${previewNeed}`)}>Open full Need page</button>
      </SupportSheet>
      <SupportSheet open={sheet === 'replace-statement'} title="Replace your edited wording?" titleId="alex-replace-statement" onClose={() => setSheet(null)}>
        <p>Your wording is kept unless you choose to replace it with this draft.</p>
        <blockquote>{statementFromDraft(draft)}</blockquote>
        <div className={styles.sheetFooterSplit}>
          <button type="button" className={styles.textButton} onClick={() => setSheet(null)}>Keep my wording</button>
          <button type="button" className={styles.primaryButton} onClick={() => buildSentence(true)}>Replace with this draft</button>
        </div>
      </SupportSheet>
    </article>
  );
}
