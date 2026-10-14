import bodyRegions from '../../data/body-regions.json';
import { analyzeObservation, selectExactObservationEntities } from '../../domain/observationInference';
import type { AlexithymiaDraft } from '../../persistence/workflowDrafts';
import { createSupportJournalDraft, statementFromDraft, supportStatementBasis, supportTermIndex } from './alexithymiaTerms';
import { shapeToJournalMood } from './shapeCoordinates';

const bodyOptions = new Map(bodyRegions.flatMap((region) => region.options.map((option) => [option.id, option])));

export function createCheckInDraft(): AlexithymiaDraft {
  return {
    checkInId: crypto.randomUUID(), updatedAt: new Date().toISOString(), stage: 0,
    observation: '', openRegion: bodyRegions[0]?.id ?? null, selectedCues: {},
    bodyClear: false, shape: {}, decisions: {}, termOrder: [], customTerms: [],
    noWordYet: false, selectedNeeds: [], statement: '', statementEdited: false,
  };
}

/** Copy the practice into the same working flow without endorsing its suggestions. */
export function checkInWithObservation(
  text: string,
  mode: 'met' | 'unmet',
  current = createCheckInDraft(),
): AlexithymiaDraft {
  const observation = text.trim();
  const analysis = analyzeObservation(observation, mode);
  const named = selectExactObservationEntities(analysis);
  const routes = new Set([
    ...analysis.suggestions.feelings.map((feeling) => `/feelings/${feeling.slug}`),
    ...named.feelings.map((feeling) => `/feelings/${feeling.slug}`),
    ...named.fauxFeelings.map((feeling) => `/faux-feelings/${feeling.slug}`),
  ]);
  const next: AlexithymiaDraft = {
    ...current, checkInId: current.checkInId ?? crypto.randomUUID(),
    updatedAt: new Date().toISOString(), stage: 1, scrollTop: 0,
    observation,
    observationSuggestions: {
      text: observation,
      termIds: [...supportTermIndex().values()].filter((term) => term.route && routes.has(term.route)).map((term) => term.id),
      needSlugs: [...new Set([
        ...analysis.suggestions.needs.map((need) => need.slug),
        ...named.needs.map((need) => need.slug),
      ])],
    },
  };
  if (next.statement.trim() && !next.statementEdited) {
    next.statement = statementFromDraft(next);
    next.statementBasis = supportStatementBasis(next);
  }
  return next;
}

/** Both continuations use one transfer owner and only the person's kept choices. */
export function journalDraftFromCheckIn(draft: AlexithymiaDraft) {
  const index = supportTermIndex(draft.customTerms);
  return createSupportJournalDraft({
    observation: draft.observation,
    terms: draft.termOrder.flatMap((id) => {
      const term = index.get(id);
      return term && (draft.decisions[id] === 'fits' || draft.decisions[id] === 'maybe') ? [term] : [];
    }),
    needSlugs: draft.selectedNeeds,
    statement: draft.statement,
    mood: shapeToJournalMood(draft.shape, draft.overallMood),
    bodyClues: Object.entries(draft.selectedCues).flatMap(([id, intensity]) => {
      const option = bodyOptions.get(id);
      return option && intensity > 0 ? [{ id, label: option.title, intensity }] : [];
    }),
    overallRatings: draft.shape,
    bodyClear: draft.bodyClear,
    noWordYet: draft.noWordYet,
    feelingIntensities: draft.feelingIntensities,
    decisions: draft.decisions,
    checkInId: draft.checkInId,
  });
}
