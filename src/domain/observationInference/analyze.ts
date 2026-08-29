import { observationInferenceIndex } from '../../data/generated/observationInference';
import { annotateObservation, normalizedObservationText } from './annotate';
import type {
  EvidenceTier,
  ObservationAnalysis,
  ObservationAnnotation,
  ObservationEntityMatch,
  ObservationMode,
  ObservationSlotId,
  ObservationSuggestion,
  SuggestionEvidence,
} from './types';

type CandidateState = {
  slug: string;
  title: string;
  score: number;
  basis: EvidenceTier;
  evidence: SuggestionEvidence[];
  catalogOrder: number;
  family: string;
};

const tierOrder: Record<EvidenceTier, number> = { broad: 1, related: 2, direct: 3 };
type CatalogFeeling = { slug: string; title: string; needSatisfaction: 'met' | 'unmet' | 'both'; catalogOrder: number };
type CatalogNeed = { slug: string; title: string; category: string; feelingSlugs: readonly string[]; fauxFeelingSlugs: readonly string[]; catalogOrder: number };
type CatalogFauxFeeling = { slug: string; title: string; feelingSlugs: readonly string[]; needSlugs: readonly string[] };
type CatalogExpression = (typeof observationInferenceIndex.expressions)[number];
type CatalogEventFamily = (typeof observationInferenceIndex.eventFamilies)[number];

const feelingBySlug = new Map<string, CatalogFeeling>(observationInferenceIndex.catalog.feelings.map((feeling, index) => [feeling.slug, { ...feeling, catalogOrder: index }]));
const needBySlug = new Map<string, CatalogNeed>(observationInferenceIndex.catalog.needs.map((need, index) => [need.slug, { ...need, catalogOrder: index }]));
const fauxFeelingBySlug = new Map<string, CatalogFauxFeeling>(observationInferenceIndex.catalog.fauxFeelings.map((feeling) => [feeling.slug, feeling]));
const expressionById = new Map<string, CatalogExpression>(observationInferenceIndex.expressions.map((expression) => [expression.id, expression]));
const eventFamilyById = new Map<string, CatalogEventFamily>(observationInferenceIndex.eventFamilies.map((family) => [family.id, family]));
const needSlugsByFeeling = new Map<string, string[]>();
observationInferenceIndex.catalog.needs.forEach((need) => need.feelingSlugs.forEach((feelingSlug) => {
  const needSlugs = needSlugsByFeeling.get(feelingSlug) ?? [];
  needSlugs.push(need.slug);
  needSlugsByFeeling.set(feelingSlug, needSlugs);
}));

function modeAllowsFeeling(slug: string, mode: ObservationMode) {
  const feeling = feelingBySlug.get(slug);
  if (!feeling) return false;
  return mode === 'met' ? feeling.needSatisfaction !== 'unmet' : feeling.needSatisfaction !== 'met';
}

const FEELING_FRAME = /\b(?:i|we)\s+(?:feel|felt|am|are|was|were|have\s+been|had\s+been|am\s+feeling|are\s+feeling)\b/i;
const NEED_FRAME = /\b(?:i|we)\s+(?:need|needed|want|wanted|value|valued|care\s+about|long\s+for|wish\s+for|am\s+seeking|are\s+seeking)\b/i;
const OTHER_EXPERIENCER_TAIL = /\b(?:(?:(?:because|while|when|if|although|though|since|that|like)\s+|as\s+(?:if|though)\s+)?(?:he|she|they|you|someone|somebody)\s+(?:is|are|was|were|feels?|felt|needs?|needed|wants?|wanted|values?|valued|cares?|cared|longs?|longed|wishes?|wished))\b|\b(?:for\s+)?(?:him|her|them)\s+to\s+(?:be|feel|have|get|need|receive)\b|\b(?:my|our)\s+(?:partner|spouse|friend|coworker|colleague|manager|supervisor|boss|parent|mother|father|mom|dad|child|kid|son|daughter|sibling|brother|sister|roommate|neighbor|client|customer|student|teacher|doctor|nurse|therapist|mentor|teammate|classmate)s?\s+to\s+(?:be|feel|have|get|need|receive)\b/i;
const NAMED_OTHER_EXPERIENCER_TAIL = /\b[A-Z][\w.'’-]*(?:\s+[A-Z][\w.'’-]*){0,2}\s+(?:is|are|was|were|feels?|felt|needs?|needed|wants?|wanted|values?|valued)\b/u;
const OTHER_REPORTER_FRAME = /\b(?:he|she|they|you|(?:my|our|the|a|an|his|her|their|your)\s+[A-Za-z][\w'’-]*(?:\s+[A-Za-z][\w'’-]*){0,2})\s+(?:said|says|wrote|writes|texted|texts|messaged|messages|reported|reports|claimed|claims|thought|thinks|believed|believes|asked|asks|wondered|wonders|told(?:\s+(?:me|us))?)\s*[,:-]?\s*(?:(?:that|if|whether|maybe|perhaps)\s*)?$/i;
const NAMED_REPORTER_FRAME = /(?:^|[\s,(])(?!(?:I|We)\b)(?:[A-Z][\w.'’-]*(?:\s+[A-Z][\w.'’-]*){0,2})\s+(?:said|says|wrote|writes|texted|texts|messaged|messages|reported|reports|claimed|claims|thought|thinks|believed|believes|asked|asks|wondered|wonders|told(?:\s+(?:me|us))?)\s*[,:-]?\s*(?:(?:that|if|whether|maybe|perhaps)\s*)?$/u;
const ATTRIBUTED_FRAME = /\baccording\s+to\s+[^,;.!?\n]{1,40}\s*,?\s*$/i;
const NEGATED_SELF_EMBEDDING = /\b(?:i|we)\s+(?:(?:do|did)\s+not|don't|didn't|never)\s+(?:think|believe|feel|say|said|claim|report|suppose|expect|mean)\b[^,;.!?\n]{0,24}$/i;
const DENIED_SELF_EMBEDDING = /\b(?:i|we)\s+(?:doubt|doubted|deny|denied)\b[^,;.!?\n]{0,24}$/i;

function statementPrefix(annotation: ObservationAnnotation, text: string) {
  const prefix = text.slice(0, annotation.start);
  let start = 0;
  for (const boundary of ['.', '!', '?', ';', '\n']) {
    const index = prefix.lastIndexOf(boundary);
    if (index >= start) start = index + 1;
  }
  return prefix.slice(start);
}

function hasAffirmativeFrame(prefix: string, frame: RegExp) {
  const matcher = new RegExp(frame.source, `${frame.flags.replace(/g/g, '')}g`);
  const matches = [...prefix.matchAll(matcher)];
  const match = matches.at(-1);
  if (!match) return false;
  const matchIndex = match.index ?? 0;
  const beforeFrame = prefix.slice(0, matchIndex).trimEnd();
  const tail = prefix.slice(matchIndex + match[0].length);
  return tail.length <= 48
    && !/[,;.!?\n]/.test(tail)
    && !/\b(?:not|never|without)\b/i.test(tail)
    && !OTHER_EXPERIENCER_TAIL.test(tail)
    && !NAMED_OTHER_EXPERIENCER_TAIL.test(tail)
    && !OTHER_REPORTER_FRAME.test(beforeFrame)
    && !NAMED_REPORTER_FRAME.test(beforeFrame)
    && !ATTRIBUTED_FRAME.test(beforeFrame)
    && !NEGATED_SELF_EMBEDDING.test(beforeFrame)
    && !DENIED_SELF_EMBEDDING.test(beforeFrame);
}

function directSelfReport(annotation: ObservationAnnotation, entityType: 'feeling' | 'need', text: string) {
  const wholeInputIsTerm = normalizedObservationText(text) === normalizedObservationText(annotation.text);
  if (wholeInputIsTerm) return true;
  const frame = entityType === 'feeling' ? FEELING_FRAME : NEED_FRAME;
  return hasAffirmativeFrame(statementPrefix(annotation, text), frame);
}

function addCandidate(
  candidates: Map<string, CandidateState>,
  entityType: 'feeling' | 'need',
  slug: string,
  basis: EvidenceTier,
  score: number,
  family: string,
  evidence: SuggestionEvidence,
) {
  const entity = entityType === 'feeling' ? feelingBySlug.get(slug) : needBySlug.get(slug);
  if (!entity) return;
  const current = candidates.get(slug);
  if (!current) {
    candidates.set(slug, {
      slug,
      title: entity.title,
      score,
      basis,
      evidence: [evidence],
      catalogOrder: entity.catalogOrder,
      family: entityType === 'need' ? needBySlug.get(slug)?.category || family : family,
    });
    return;
  }
  const evidenceKey = `${evidence.kind}:${evidence.annotationId}:${evidence.evidenceId}`;
  if (!current.evidence.some((entry) => `${entry.kind}:${entry.annotationId}:${entry.evidenceId}` === evidenceKey)) {
    current.evidence.push(evidence);
    current.score += Math.min(42, Math.max(12, Math.round(score * 0.055)));
  }
  if (score > current.score) current.score = score;
  if (tierOrder[basis] > tierOrder[current.basis]) current.basis = basis;
}

function rankedCandidates(candidates: Map<string, CandidateState>) {
  return [...candidates.values()].sort((left, right) => (
    right.score - left.score
    || right.evidence.length - left.evidence.length
    || left.catalogOrder - right.catalogOrder
  ));
}

function selectDiverse(candidates: CandidateState[], limit: number) {
  const remaining = [...candidates];
  const selected: CandidateState[] = [];
  const families = new Set<string>();
  while (remaining.length && selected.length < limit) {
    const best = remaining[0];
    if (!best) break;
    const closeIndex = remaining.findIndex((candidate) => (
      candidate.score >= best.score - 36
      && candidate.family
      && !families.has(candidate.family)
    ));
    const index = closeIndex >= 0 ? closeIndex : 0;
    const [candidate] = remaining.splice(index, 1);
    if (!candidate) continue;
    selected.push(candidate);
    if (candidate.family) families.add(candidate.family);
  }
  return selected;
}

function suggestion(candidate: CandidateState): ObservationSuggestion {
  return {
    slug: candidate.slug,
    title: candidate.title,
    basis: candidate.basis,
    evidence: candidate.evidence,
  };
}

function overallBasis(feelings: ObservationSuggestion[], needs: ObservationSuggestion[]) {
  const bases = new Set([...feelings, ...needs].map((candidate) => candidate.basis));
  if (!bases.size) return null;
  if (bases.size === 1) return [...bases][0] ?? null;
  return 'mixed' as const;
}

function fingerprint(text: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function analyzeObservation(text: string, mode: ObservationMode = 'unmet'): ObservationAnalysis {
  const source = typeof text === 'string' ? text : '';
  const { annotations } = annotateObservation(source);
  const feelingCandidates = new Map<string, CandidateState>();
  const needCandidates = new Map<string, CandidateState>();

  annotations.forEach((annotation) => {
    annotation.evidence.forEach((evidence) => {
      if (evidence.kind === 'entity') {
        if (evidence.entityType === 'feeling') {
          if (!directSelfReport(annotation, 'feeling', source)) return;
          const basis = evidence.matchKind === 'fuzzy' ? 'related' : 'direct';
          const score = evidence.matchKind === 'title' ? 1000 : evidence.matchKind === 'fuzzy' ? 760 : 900;
          addCandidate(feelingCandidates, 'feeling', evidence.slug, basis, score, 'self-report', {
            kind: 'entity', tier: basis, annotationId: annotation.id, evidenceId: evidence.slug,
          });
          needSlugsByFeeling.get(evidence.slug)?.forEach((slug) => addCandidate(needCandidates, 'need', slug, 'related', 640, `feeling:${evidence.slug}`, {
            kind: 'entity', tier: 'related', annotationId: annotation.id, evidenceId: `feeling:${evidence.slug}`,
          }));
        } else if (evidence.entityType === 'need') {
          if (!directSelfReport(annotation, 'need', source)) return;
          const basis = evidence.matchKind === 'fuzzy' ? 'related' : 'direct';
          const score = evidence.matchKind === 'title' ? 1000 : evidence.matchKind === 'fuzzy' ? 760 : 900;
          addCandidate(needCandidates, 'need', evidence.slug, basis, score, 'self-report', {
            kind: 'entity', tier: basis, annotationId: annotation.id, evidenceId: evidence.slug,
          });
          needBySlug.get(evidence.slug)?.feelingSlugs.forEach((slug) => {
            if (modeAllowsFeeling(slug, mode)) addCandidate(feelingCandidates, 'feeling', slug, 'related', 640, `need:${evidence.slug}`, {
              kind: 'entity', tier: 'related', annotationId: annotation.id, evidenceId: `need:${evidence.slug}`,
            });
          });
        } else if (directSelfReport(annotation, 'feeling', source)) {
          const fauxFeeling = fauxFeelingBySlug.get(evidence.slug);
          fauxFeeling?.feelingSlugs.forEach((slug) => {
            if (modeAllowsFeeling(slug, mode)) addCandidate(feelingCandidates, 'feeling', slug, 'related', 735, `faux:${evidence.slug}`, {
              kind: 'fauxFeeling', tier: 'related', annotationId: annotation.id, evidenceId: evidence.slug,
            });
          });
          fauxFeeling?.needSlugs.forEach((slug) => addCandidate(needCandidates, 'need', slug, 'related', 735, `faux:${evidence.slug}`, {
            kind: 'fauxFeeling', tier: 'related', annotationId: annotation.id, evidenceId: evidence.slug,
          }));
        }
      } else if (evidence.kind === 'eventFamily') {
        const family = eventFamilyById.get(evidence.familyId);
        if (!family) return;
        const ambiguity = family.feelingSlugs.length + family.needSlugs.length;
        const base = evidence.tier === 'related' ? 720 : 480;
        const score = Math.max(240, base + Math.min(80, annotation.text.length) - Math.max(0, ambiguity - 4) * 4);
        family.feelingSlugs.forEach((slug) => {
          if (modeAllowsFeeling(slug, mode)) addCandidate(feelingCandidates, 'feeling', slug, evidence.tier, score, family.id, {
            kind: 'eventFamily', tier: evidence.tier, annotationId: annotation.id, evidenceId: family.id,
          });
        });
        family.needSlugs.forEach((slug) => addCandidate(needCandidates, 'need', slug, evidence.tier, score, family.id, {
          kind: 'eventFamily', tier: evidence.tier, annotationId: annotation.id, evidenceId: family.id,
        }));
      } else if (evidence.kind === 'cue') {
        const expression = expressionById.get(evidence.expressionId);
        if (!expression) return;
        const ambiguity = expression.feelingSlugs.length + expression.needSlugs.length;
        const base = evidence.tier === 'related' ? 510 : 360;
        const score = Math.max(180, base + Math.min(80, annotation.text.length) - Math.max(0, ambiguity - 2) * 3);
        expression.feelingSlugs.forEach((slug) => {
          if (modeAllowsFeeling(slug, mode)) addCandidate(feelingCandidates, 'feeling', slug, evidence.tier, score, expression.id, {
            kind: 'cue', tier: evidence.tier, annotationId: annotation.id, evidenceId: expression.id,
          });
        });
        expression.needSlugs.forEach((slug) => addCandidate(needCandidates, 'need', slug, evidence.tier, score, expression.id, {
          kind: 'cue', tier: evidence.tier, annotationId: annotation.id, evidenceId: expression.id,
        }));
      }
    });
  });

  const blank = !source.trim();
  const feelings = blank ? [] : selectDiverse(rankedCandidates(feelingCandidates), 4).map(suggestion);
  const needs = blank ? [] : selectDiverse(rankedCandidates(needCandidates), 4).map(suggestion);

  const slots = Object.fromEntries(observationInferenceIndex.slots.map((slot) => {
    const matches = annotations.filter((annotation) => annotation.evidence.some((evidence) => (
      evidence.kind === 'formula' && evidence.slot === slot.id
    )));
    const detectorIds = [...new Set(matches.flatMap((annotation) => annotation.evidence
      .filter((evidence) => evidence.kind === 'formula' && evidence.slot === slot.id)
      .map((evidence) => evidence.kind === 'formula' ? evidence.detectorId : '')))].filter(Boolean);
    return [slot.id, { id: slot.id, satisfied: matches.length > 0, annotationIds: matches.map((match) => match.id), detectorIds }];
  })) as Record<ObservationSlotId, ObservationAnalysis['slots'][ObservationSlotId]>;

  const surfaceTerms = annotations.flatMap((annotation) => annotation.evidence
    .filter((evidence) => evidence.kind === 'surface')
    .map((evidence) => evidence.kind === 'surface' ? {
      id: evidence.termId,
      label: evidence.label,
      text: annotation.text,
      start: annotation.start,
      end: annotation.end,
    } : null))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const entities: ObservationEntityMatch[] = [];
  const entityKeys = new Set<string>();
  annotations.forEach((annotation) => annotation.evidence.forEach((evidence) => {
    if (evidence.kind !== 'entity') return;
    const key = `${evidence.entityType}:${evidence.slug}:${annotation.start}:${annotation.end}`;
    if (entityKeys.has(key)) return;
    entityKeys.add(key);
    entities.push({
      entityType: evidence.entityType,
      slug: evidence.slug,
      title: evidence.title,
      matchKind: evidence.matchKind,
      text: annotation.text,
      start: annotation.start,
      end: annotation.end,
      annotationId: annotation.id,
    });
  }));

  const inputFingerprint = fingerprint(source);
  return {
    text: source,
    mode,
    version: `${observationInferenceIndex.modelVersion}:${mode}:${inputFingerprint}`,
    annotations,
    slots,
    suggestions: { feelings, needs, basis: overallBasis(feelings, needs) },
    surfaceTerms,
    entities,
    model: {
      schemaVersion: observationInferenceIndex.schemaVersion,
      modelVersion: observationInferenceIndex.modelVersion,
      sourceChecksum: observationInferenceIndex.sourceChecksum,
      catalogChecksum: observationInferenceIndex.catalogChecksum,
      inputFingerprint,
    },
  };
}
