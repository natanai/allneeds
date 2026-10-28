import { customTermId } from './customWordIdentity';
export { customTermId } from './customWordIdentity';

import {
  fauxFeelings,
  feelings,
  feelingsBySlug,
  needsBySlug,
} from '../../data/catalog';
import {
  alexithymiaCandidates,
  type AlexithymiaCandidate,
} from './alexithymiaData';
import type { JournalComposerDraft } from '../../persistence/workflowDrafts';
import type { EntityRef, Need } from '../../domain/models';
import type { JournalMood, JournalGuidedSupport } from '../journal/journalRepository';

export type SupportTermRole = 'feeling' | 'faux-feeling' | 'working';

export type SupportTerm = {
  id: string;
  label: string;
  role: SupportTermRole;
  roleLabel: 'Feeling' | 'Faux Feeling' | 'Other emotion word' | 'Your word';
  route: string | null;
  catalogSlug: string | null;
  definition: string;
  definitionSource: string | null;
  candidate: AlexithymiaCandidate | null;
};

export function candidateTerm(candidate: AlexithymiaCandidate): SupportTerm {
  const canonicalFeeling = candidate.catalogSlug
    ? feelingsBySlug.get(candidate.catalogSlug)
    : null;
  return {
    id: `candidate:${candidate.key}`,
    label: candidate.display,
    role: candidate.role,
    roleLabel: candidate.role === 'feeling' ? 'Feeling' : 'Other emotion word',
    route: candidate.route,
    catalogSlug: canonicalFeeling?.slug ?? null,
    definition: canonicalFeeling?.summary ?? candidate.definition ?? '',
    definitionSource: candidate.definitionSource === 'catalog'
      ? candidate.route
      : candidate.definitionSource,
    candidate,
  };
}

export const profileTerms = alexithymiaCandidates.map(candidateTerm);
const candidateFeelingSlugs = new Set(
  alexithymiaCandidates.map((candidate) => candidate.catalogSlug).filter(Boolean),
);

export const catalogOnlyTerms: SupportTerm[] = feelings
  .filter((feeling) => !candidateFeelingSlugs.has(feeling.slug))
  .map((feeling) => ({
    id: `feeling:${feeling.slug}`,
    label: feeling.title,
    role: 'feeling',
    roleLabel: 'Feeling',
    route: `/feelings/${feeling.slug}`,
    catalogSlug: feeling.slug,
    definition: feeling.summary,
    definitionSource: `/feelings/${feeling.slug}`,
    candidate: null,
  }));

export const fauxFeelingTerms: SupportTerm[] = fauxFeelings.map((feeling) => ({
  id: `faux:${feeling.slug}`,
  label: feeling.title,
  role: 'faux-feeling',
  roleLabel: 'Faux Feeling',
  route: `/faux-feelings/${feeling.slug}`,
  catalogSlug: feeling.slug,
  definition: `In allneeds, “${feeling.title}” is a Faux Feeling: a word that may combine an emotion with an interpretation of what happened. That label does not mean the event was unreal.`,
  definitionSource: `/faux-feelings/${feeling.slug}`,
  candidate: null,
}));

export function customWorkingTerm(label: string): SupportTerm {
  return {
    id: customTermId(label),
    label: label.trim(),
    role: 'working',
    roleLabel: 'Your word',
    route: null,
    catalogSlug: null,
    definition: 'A word you entered for this moment. It stays with this check-in and is not added to the site’s Feeling list.',
    definitionSource: null,
    candidate: null,
  };
}

export function supportTermIndex(customTerms: string[] = []) {
  const terms = [
    ...profileTerms,
    ...catalogOnlyTerms,
    ...fauxFeelingTerms,
    ...customTerms.filter((term) => term.trim()).map(customWorkingTerm),
  ];
  return new Map(terms.map((term) => [term.id, term]));
}

/** Existing cross-reference links are possibilities, never selected Needs. */
export function suggestedNeedsForTerms(
  terms: SupportTerm[],
  decisions: Record<string, string>,
): Array<{ need: Need; fromFeelings: EntityRef[] }> {
  const suggestions = new Map<string, { need: Need; fromFeelings: EntityRef[] }>();
  for (const term of terms) {
    if (term.role !== 'feeling' || decisions[term.id] !== 'fits' || !term.catalogSlug) continue;
    const feeling = feelingsBySlug.get(term.catalogSlug);
    if (!feeling) continue;
    for (const reference of feeling.needs) {
      const need = needsBySlug.get(reference.slug);
      if (!need) continue;
      const suggestion = suggestions.get(need.slug) ?? { need, fromFeelings: [] };
      if (!suggestion.fromFeelings.some((source) => source.slug === feeling.slug)) {
        suggestion.fromFeelings.push({ slug: feeling.slug, title: feeling.title });
      }
      suggestions.set(need.slug, suggestion);
    }
  }
  return [...suggestions.values()].sort((a, b) => a.need.title.localeCompare(b.need.title));
}

function joinWords(words: string[]) {
  if (words.length < 2) return words[0] ?? '';
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(', ')}, and ${words.at(-1)}`;
}

function sentenceCase(value: string) {
  if (!value || /^I(?:\b|['’])/u.test(value)) return value;
  return value.charAt(0).toLocaleLowerCase() + value.slice(1);
}

export function buildSupportStatement({
  observation,
  terms,
  needSlugs,
  noWordYet,
  decisions,
}: {
  observation: string;
  terms: SupportTerm[];
  needSlugs: string[];
  noWordYet: boolean;
  decisions?: Record<string, string>;
}) {
  const cleanObservation = observation.trim().replace(/[.!?]+$/, '');
  const observationClause = cleanObservation
    ? /^when\b/i.test(cleanObservation)
      ? cleanObservation
      : `When ${sentenceCase(cleanObservation)}`
    : '';
  const feelingsClause = terms.length
    ? joinWords(terms.map((term) => `${decisions?.[term.id] === 'maybe' ? 'I might feel' : 'I feel'} ${term.label.toLocaleLowerCase()}`))
    : noWordYet
      ? 'I’m not sure what I feel yet'
      : '';
  const needTitles = needSlugs
    .map((slug) => needsBySlug.get(slug)?.title)
    .filter((title): title is string => Boolean(title));
  const needsClause = needTitles.length ? `I need ${joinWords(needTitles.map((title) => title.toLocaleLowerCase()))}` : '';

  let experience = feelingsClause;
  if (feelingsClause && needsClause) experience = `${feelingsClause} because ${needsClause}`;
  else if (needsClause) experience = needsClause;

  const sentence = [observationClause, experience].filter(Boolean).join(observationClause && experience ? ', ' : '');
  return sentence ? `${sentence}.` : '';
}

export function createSupportJournalDraft({
  observation,
  terms,
  needSlugs,
  statement,
  mood,
  bodyClues,
  overallRatings,
  bodyClear,
  noWordYet,
  feelingIntensities,
  decisions,
  checkInId,
}: {
  observation: string;
  terms: SupportTerm[];
  needSlugs: string[];
  statement: string;
  mood?: JournalMood;
  bodyClues?: JournalGuidedSupport['bodyClues'];
  overallRatings?: JournalGuidedSupport['overallRatings'];
  bodyClear?: boolean;
  noWordYet?: boolean;
  feelingIntensities?: Record<string, number>;
  decisions?: Record<string, string>;
  checkInId?: string;
}): JournalComposerDraft {
  const canonicalFeelings = terms.filter((term) => term.role === 'feeling');
  const cleanObservation = observation.trim();
  const cleanStatement = statement.trim();
  // The finished statement is the person's Reflection. Keep the original
  // observation in guidedSupport without appending a second copy to their text.
  const notes = cleanStatement || cleanObservation || (terms.length
    ? `Words you chose: ${terms.map((term) => `${term.label} (${term.roleLabel})`).join(', ')}`
    : '');
  return {
    notes,
    ...(mood ? { mood } : {}),
    emotion: canonicalFeelings.map((term) => term.label).join(', '),
    intensity: 5,
    // Only an explicit 1–10 selection is a reported rating. Unrated legacy
    // check-ins keep the unknown provenance rather than acquiring fake 5/10s.
    feelings: canonicalFeelings.map((term) => {
      const rating = feelingIntensities?.[term.id];
      return rating !== undefined && Number.isInteger(rating) && rating >= 1 && rating <= 10
        ? { feeling: term.label, intensity: rating }
        : { feeling: term.label, intensity: 5, ratingSource: 'unknown' as const };
    }),
    selectedNeeds: needSlugs,
    tags: 'alexithymia-check-in',
    editingId: null,
    guidedSupport: {
      observation: cleanObservation,
      terms: terms.map((term) => ({ label: term.label, role: term.role,
        ...(decisions?.[term.id] === 'fits' || decisions?.[term.id] === 'maybe'
          ? { decision: decisions[term.id] as 'fits' | 'maybe' } : {}),
      })),
      ...(checkInId ? { checkInId } : {}),
      statement: cleanStatement,
      ...(bodyClues?.length ? { bodyClues } : {}),
      ...(overallRatings && Object.keys(overallRatings).length ? { overallRatings } : {}),
      ...(bodyClear ? { bodyClear: true } : {}),
      ...(noWordYet ? { noWordYet: true } : {}),
    },
  };
}

/** The generated sentence is derived from these choices, never from a score. */
export function supportStatementBasis(draft: Pick<import('../../persistence/workflowDrafts').AlexithymiaDraft,
  'observation' | 'termOrder' | 'customTerms' | 'decisions' | 'selectedNeeds' | 'noWordYet'>) {
  const index = supportTermIndex(draft.customTerms);
  return JSON.stringify([
    draft.observation, draft.termOrder.filter((id) => index.has(id))
      .filter((id) => draft.decisions[id] === 'fits' || draft.decisions[id] === 'maybe')
      .map((id) => [id, draft.decisions[id]]),
    draft.selectedNeeds, draft.noWordYet,
  ]);
}

export function statementFromDraft(draft: import('../../persistence/workflowDrafts').AlexithymiaDraft) {
  const index = supportTermIndex(draft.customTerms);
  return buildSupportStatement({
    observation: draft.observation,
    terms: draft.termOrder.flatMap((id) => {
      const term = index.get(id);
      return term && (draft.decisions[id] === 'fits' || draft.decisions[id] === 'maybe') ? [term] : [];
    }),
    needSlugs: draft.selectedNeeds, noWordYet: draft.noWordYet, decisions: draft.decisions,
  });
}
