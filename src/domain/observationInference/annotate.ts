import { observationInferenceIndex } from '../../data/generated/observationInference';
import {
  findQuoteRanges,
  normalizeForMatch,
  phraseTokens,
  rangeInside,
  tokenizeObservation,
} from './normalize';
import type {
  EntityEvidence,
  EntityMatchKind,
  ObservationAnnotation,
  ObservationEntityType,
  ObservationEvidence,
  ObservationToken,
  TextRange,
} from './types';

type TermTarget =
  | { kind: 'entity'; entityType: ObservationEntityType; slug: string; title: string; matchKind: EntityMatchKind }
  | { kind: 'guidance'; ruleId: string; label: string; explanation: string }
  | { kind: 'surface'; termId: string; label: string };

type TermMatcher = {
  normalized: string;
  tokens: string[];
  target: TermTarget;
};

type CompiledDetector<T> = T & { regex: RegExp };

const STOPWORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'could', 'every', 'first',
  'from', 'have', 'into', 'just', 'more', 'most', 'other', 'over', 'really', 'should', 'some',
  'than', 'that', 'their', 'there', 'these', 'they', 'this', 'those', 'through', 'very', 'what',
  'when', 'where', 'which', 'while', 'with', 'would', 'your',
]);

function compiledRegex(pattern: string, flags: string) {
  return new RegExp(pattern, `${flags.replace(/g/g, '')}g`);
}

const slotDetectors = observationInferenceIndex.slots.flatMap((slot) => slot.detectors.map((detector) => ({
  ...detector,
  slotId: slot.id,
  regex: compiledRegex(detector.pattern, detector.flags),
})));

const cueDetectors = observationInferenceIndex.expressions.map((expression) => ({
  ...expression,
  regex: compiledRegex(expression.pattern, expression.flags),
}));

const guidanceRuleById = new Map(observationInferenceIndex.guidanceRules.map((rule) => [rule.id, rule]));
const eventFamilyDetectors = observationInferenceIndex.eventFamilies.flatMap((family) => family.patterns.map((pattern) => ({
  ...pattern,
  familyId: family.id,
  tier: family.tier,
  label: family.label,
  explanation: family.explanation,
  lexiconRuleId: family.lexiconRuleId,
  lexiconExcludeTerms: family.lexiconExcludeTerms,
  regex: compiledRegex(pattern.pattern, pattern.flags),
})));

const guidancePatternDetectors = observationInferenceIndex.guidanceRules.flatMap((rule) => rule.patterns.map((pattern) => ({
  ...pattern,
  ruleId: rule.id,
  label: rule.label,
  explanation: rule.explanation,
  regex: compiledRegex(pattern.pattern, pattern.flags),
})));

function addTermMatcher(target: TermMatcher[], seen: Set<string>, term: string, termTarget: TermTarget) {
  const tokens = phraseTokens(term);
  if (!tokens.length) return;
  const normalized = tokens.join(' ');
  const targetKey = termTarget.kind === 'entity'
    ? `${termTarget.kind}:${termTarget.entityType}:${termTarget.slug}:${termTarget.matchKind}`
    : termTarget.kind === 'guidance'
      ? `${termTarget.kind}:${termTarget.ruleId}`
      : `${termTarget.kind}:${termTarget.termId}`;
  const key = `${normalized}|${targetKey}`;
  if (seen.has(key)) return;
  seen.add(key);
  target.push({ normalized, tokens, target: termTarget });
}

function buildTermMatchers() {
  const matchers: TermMatcher[] = [];
  const seen = new Set<string>();
  const addEntity = (entityType: ObservationEntityType, slug: string, title: string) => {
    const exactTarget: TermTarget = { kind: 'entity', entityType, slug, title, matchKind: 'title' };
    addTermMatcher(matchers, seen, title, exactTarget);
    addTermMatcher(matchers, seen, slug.replace(/-/g, ' '), exactTarget);
  };

  observationInferenceIndex.catalog.feelings.forEach((feeling) => addEntity('feeling', feeling.slug, feeling.title));
  observationInferenceIndex.catalog.needs.forEach((need) => addEntity('need', need.slug, need.title));
  observationInferenceIndex.catalog.fauxFeelings.forEach((feeling) => addEntity('fauxFeeling', feeling.slug, feeling.title));
  observationInferenceIndex.lexicalBridges.forEach((bridge) => {
    const collection = bridge.entityType === 'feeling'
      ? observationInferenceIndex.catalog.feelings
      : bridge.entityType === 'need'
        ? observationInferenceIndex.catalog.needs
        : observationInferenceIndex.catalog.fauxFeelings;
    const entity = collection.find((candidate) => candidate.slug === bridge.slug);
    if (!entity) return;
    bridge.terms.forEach((term) => addTermMatcher(matchers, seen, term, {
      kind: 'entity', entityType: bridge.entityType, slug: bridge.slug, title: entity.title, matchKind: 'bridge',
    }));
  });
  observationInferenceIndex.guidanceRules.forEach((rule) => {
    rule.terms.forEach((term) => addTermMatcher(matchers, seen, term, {
      kind: 'guidance', ruleId: rule.id, label: rule.label, explanation: rule.explanation,
    }));
  });
  observationInferenceIndex.surfaceTerms.forEach((surfaceTerm) => {
    surfaceTerm.terms.forEach((term) => addTermMatcher(matchers, seen, term, {
      kind: 'surface', termId: surfaceTerm.id, label: surfaceTerm.label,
    }));
  });

  return matchers.sort((left, right) => right.tokens.length - left.tokens.length || right.normalized.length - left.normalized.length);
}

const termMatchers = buildTermMatchers();
const termMatchersByFirstToken = new Map<string, TermMatcher[]>();
termMatchers.forEach((matcher) => {
  const first = matcher.tokens[0];
  if (!first) return;
  const entries = termMatchersByFirstToken.get(first) ?? [];
  entries.push(matcher);
  termMatchersByFirstToken.set(first, entries);
});

const primarySingleTokenEntities = termMatchers.filter((matcher) => (
  matcher.target.kind === 'entity'
  && matcher.target.matchKind === 'title'
  && matcher.tokens.length === 1
));

function findRegexMatches<T>(detector: CompiledDetector<T>, text: string) {
  const matches: TextRange[] = [];
  detector.regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = detector.regex.exec(text)) !== null) {
    if (!match[0]) {
      detector.regex.lastIndex += 1;
      continue;
    }
    matches.push({ start: match.index, end: match.index + match[0].length });
  }
  return matches;
}

function normalizedPhrase(term: string) {
  return phraseTokens(term).join(' ');
}

function containsTokenPhrase(source: string, term: string) {
  const sourceTokens = phraseTokens(source);
  const termTokens = phraseTokens(term);
  if (!termTokens.length || termTokens.length > sourceTokens.length) return false;
  for (let start = 0; start <= sourceTokens.length - termTokens.length; start += 1) {
    if (termTokens.every((token, offset) => sourceTokens[start + offset] === token)) return true;
  }
  return false;
}

const EVENT_SELF_STATE_ANCHOR = /\b(?:i|we)\s+(?:am|are|was|were)\b/giu;
const EVENT_TARGET_PRONOUN = /\b(?:me|us)\b/giu;

function eventFamilyLexiconText(matchedText: string, lexiconRuleId: string | null | undefined) {
  const quote = findQuoteRanges(matchedText)[0];
  if (quote) {
    const quoteText = matchedText.slice(quote.start, quote.end);
    if (lexiconRuleId === 'trait-labels' && !/\byou\b/iu.test(quoteText)) return '';
    return quoteText;
  }

  EVENT_SELF_STATE_ANCHOR.lastIndex = 0;
  const selfState = [...matchedText.matchAll(EVENT_SELF_STATE_ANCHOR)].at(-1);
  if (selfState) return matchedText.slice((selfState.index ?? 0) + selfState[0].length);

  EVENT_TARGET_PRONOUN.lastIndex = 0;
  const target = [...matchedText.matchAll(EVENT_TARGET_PRONOUN)][0];
  if (target) return matchedText.slice((target.index ?? 0) + target[0].length);

  return matchedText;
}

function eventFamilyRangeHasRequiredLexicon(
  text: string,
  range: TextRange,
  lexiconRuleId: string | null | undefined,
  lexiconExcludeTerms: readonly string[],
) {
  if (!lexiconRuleId) return true;
  const rule = guidanceRuleById.get(lexiconRuleId);
  if (!rule?.terms.length) return false;
  const excluded = new Set(lexiconExcludeTerms.map(normalizedPhrase));
  const matchedText = text.slice(range.start, range.end);
  const lexiconText = eventFamilyLexiconText(matchedText, lexiconRuleId);
  return rule.terms
    .filter((term) => !excluded.has(normalizedPhrase(term)))
    .some((term) => containsTokenPhrase(lexiconText, term));
}

function samePhrase(tokens: ObservationToken[], startIndex: number, matcher: TermMatcher, text: string) {
  if (startIndex + matcher.tokens.length > tokens.length) return null;
  for (let offset = 0; offset < matcher.tokens.length; offset += 1) {
    const token = tokens[startIndex + offset];
    if (!token || token.normalized !== matcher.tokens[offset] || token.quoted) return null;
    if (offset > 0) {
      const previous = tokens[startIndex + offset - 1];
      if (!previous || !/^[\s/()\-]+$/u.test(text.slice(previous.end, token.start))) return null;
    }
  }
  const first = tokens[startIndex];
  const last = tokens[startIndex + matcher.tokens.length - 1];
  return first && last ? { start: first.start, end: last.end } : null;
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length] ?? Number.POSITIVE_INFINITY;
}

function fuzzyEntity(token: ObservationToken, exactEntityTokenMatches: Set<number>): EntityEvidence | null {
  if (token.quoted || token.normalized.length < 5 || STOPWORDS.has(token.normalized) || exactEntityTokenMatches.has(token.start)) return null;
  const threshold = token.normalized.length >= 8 ? 2 : 1;
  let bestDistance = threshold + 1;
  let best: TermMatcher | null = null;
  let tied = false;
  for (const matcher of primarySingleTokenEntities) {
    const candidate = matcher.tokens[0];
    if (!candidate || Math.abs(candidate.length - token.normalized.length) > threshold) continue;
    const distance = editDistance(token.normalized, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = matcher;
      tied = false;
    } else if (distance === bestDistance && matcher.target.kind === 'entity' && best?.target.kind === 'entity'
      && (matcher.target.slug !== best.target.slug || matcher.target.entityType !== best.target.entityType)) {
      tied = true;
    }
  }
  if (!best || tied || bestDistance > threshold || best.target.kind !== 'entity') return null;
  return { ...best.target, matchKind: 'fuzzy' };
}

function evidenceKey(evidence: ObservationEvidence) {
  if (evidence.kind === 'formula') return `${evidence.kind}:${evidence.slot}:${evidence.detectorId}`;
  if (evidence.kind === 'entity') return `${evidence.kind}:${evidence.entityType}:${evidence.slug}:${evidence.matchKind}`;
  if (evidence.kind === 'cue') return `${evidence.kind}:${evidence.expressionId}:${evidence.tier}`;
  if (evidence.kind === 'eventFamily') return `${evidence.kind}:${evidence.familyId}:${evidence.tier}`;
  if (evidence.kind === 'guidance') return `${evidence.kind}:${evidence.ruleId}`;
  return `${evidence.kind}:${evidence.termId}`;
}

export function annotateObservation(text: string) {
  const quoteRanges = findQuoteRanges(text);
  const { tokens, clauses } = tokenizeObservation(text, quoteRanges);
  const annotationMap = new Map<string, Omit<ObservationAnnotation, 'id'>>();
  const exactEntityTokenMatches = new Set<number>();

  const add = (range: TextRange, evidence: ObservationEvidence) => {
    if (range.end <= range.start) return;
    const key = `${range.start}:${range.end}`;
    const current = annotationMap.get(key) ?? {
      start: range.start,
      end: range.end,
      text: text.slice(range.start, range.end),
      evidence: [],
    };
    const keyForEvidence = evidenceKey(evidence);
    if (!current.evidence.some((entry) => evidenceKey(entry) === keyForEvidence)) current.evidence.push(evidence);
    annotationMap.set(key, current);
  };

  slotDetectors.forEach((detector) => {
    findRegexMatches(detector, text).forEach((range) => add(range, {
      kind: 'formula',
      slot: detector.slotId,
      detectorId: detector.id,
    }));
  });

  cueDetectors.forEach((detector) => {
    findRegexMatches(detector, text)
      .filter((range) => !rangeInside(range, quoteRanges))
      .forEach((range) => add(range, {
        kind: 'cue',
        expressionId: detector.id,
        tier: detector.tier,
      }));
  });

  eventFamilyDetectors.forEach((detector) => {
    findRegexMatches(detector, text)
      .filter((range) => !rangeInside(range, quoteRanges))
      .filter((range) => eventFamilyRangeHasRequiredLexicon(
        text,
        range,
        detector.lexiconRuleId,
        detector.lexiconExcludeTerms,
      ))
      .forEach((range) => add(range, {
        kind: 'eventFamily',
        familyId: detector.familyId,
        tier: detector.tier,
        label: detector.label,
        explanation: detector.explanation,
      }));
  });

  guidancePatternDetectors.forEach((detector) => {
    findRegexMatches(detector, text)
      .filter((range) => !rangeInside(range, quoteRanges))
      .forEach((range) => add(range, {
        kind: 'guidance',
        ruleId: detector.ruleId,
        label: detector.label,
        explanation: detector.explanation,
      }));
  });

  tokens.forEach((token, tokenIndex) => {
    if (token.quoted) return;
    const candidates = termMatchersByFirstToken.get(token.normalized) ?? [];
    candidates.forEach((matcher) => {
      const range = samePhrase(tokens, tokenIndex, matcher, text);
      if (!range) return;
      if (matcher.target.kind === 'entity') {
        exactEntityTokenMatches.add(token.start);
        add(range, matcher.target);
      } else if (matcher.target.kind === 'guidance') {
        add(range, matcher.target);
      } else {
        add(range, { kind: 'surface', termId: matcher.target.termId, label: matcher.target.label });
      }
    });
  });

  tokens.forEach((token) => {
    const evidence = fuzzyEntity(token, exactEntityTokenMatches);
    if (evidence) add({ start: token.start, end: token.end }, evidence);
  });

  const annotations = [...annotationMap.values()]
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .map((annotation, index) => ({ ...annotation, id: `observation-${annotation.start}-${annotation.end}-${index}` }));

  return { annotations, tokens, clauses, quoteRanges };
}

export function normalizedObservationText(text: string) {
  return normalizeForMatch(text).trim();
}
