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

export type SupportTermRole = 'feeling' | 'faux-feeling' | 'working';

export type SupportTerm = {
  id: string;
  label: string;
  role: SupportTermRole;
  roleLabel: 'Feeling' | 'Faux Feeling' | 'Working term';
  route: string | null;
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
    roleLabel: candidate.role === 'feeling' ? 'Feeling' : 'Working term',
    route: candidate.route,
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
  definition: `In allneeds, “${feeling.title}” is a Faux Feeling: a word that may combine an emotion with an interpretation of what happened. That label does not mean the event was unreal.`,
  definitionSource: `/faux-feelings/${feeling.slug}`,
  candidate: null,
}));

export function customTermId(label: string) {
  return `working:${label.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

export function customWorkingTerm(label: string): SupportTerm {
  return {
    id: customTermId(label),
    label: label.trim(),
    role: 'working',
    roleLabel: 'Working term',
    route: null,
    definition: 'A word you entered for this moment. It is not being added to the official Feeling catalog.',
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
}: {
  observation: string;
  terms: SupportTerm[];
  needSlugs: string[];
  noWordYet: boolean;
}) {
  const cleanObservation = observation.trim().replace(/[.!?]+$/, '');
  const observationClause = cleanObservation
    ? /^when\b/i.test(cleanObservation)
      ? cleanObservation
      : `When ${sentenceCase(cleanObservation)}`
    : '';
  const feelingsClause = terms.length
    ? `I feel ${joinWords(terms.map((term) => term.label.toLocaleLowerCase()))}`
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
}: {
  observation: string;
  terms: SupportTerm[];
  needSlugs: string[];
  statement: string;
}): JournalComposerDraft {
  const canonicalFeelings = terms.filter((term) => term.role === 'feeling');
  const cleanObservation = observation.trim();
  const cleanStatement = statement.trim();
  const assembledNotes = [
    cleanStatement,
    cleanObservation && !cleanStatement.includes(cleanObservation)
      ? `What happened: ${cleanObservation}`
      : '',
  ].filter(Boolean).join('\n\n');
  const notes = assembledNotes || (terms.length
    ? `Working words: ${terms.map((term) => `${term.label} (${term.roleLabel})`).join(', ')}`
    : '');
  return {
    notes,
    emotion: canonicalFeelings.map((term) => term.label).join(', '),
    intensity: 5,
    feelings: canonicalFeelings.map((term) => ({ feeling: term.label, intensity: 5 })),
    selectedNeeds: needSlugs,
    tags: 'alexithymia-check-in',
    editingId: null,
    guidedSupport: {
      observation: cleanObservation,
      terms: terms.map((term) => ({ label: term.label, role: term.role })),
      statement: cleanStatement,
    },
  };
}
