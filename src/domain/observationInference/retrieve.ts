import { fauxFeelings, feelings, needs } from '../../data/catalog';
import { observationInferenceIndex } from '../../data/generated/observationInference';
import { normalizeForMatch, phraseTokens } from './normalize';
import type { ObservationMode } from './types';

export type NeedRetrievalMatch = {
  slug: string;
  title: string;
  score: number;
  matchedTerms: string[];
};

type SearchDocument = {
  slug: string;
  title: string;
  category: string;
  weights: Map<string, number>;
  breadth: number;
};

const STOPWORDS = new Set([
  'a', 'about', 'after', 'again', 'all', 'also', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'because',
  'been', 'before', 'being', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has',
  'have', 'he', 'her', 'here', 'him', 'his', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me',
  'more', 'most', 'my', 'of', 'on', 'or', 'our', 'ours', 'she', 'so', 'some', 'that', 'the', 'their',
  'them', 'then', 'there', 'they', 'this', 'those', 'to', 'too', 'us', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your',
]);

function stemToken(token: string) {
  let value = token.toLocaleLowerCase('en-US');
  if (value.length > 5 && value.endsWith('ies')) value = `${value.slice(0, -3)}y`;
  else if (value.length > 6 && value.endsWith('ing')) {
    value = value.slice(0, -3);
    if (/([b-df-hj-np-tv-z])\1$/u.test(value)) value = value.slice(0, -1);
  } else if (value.length > 5 && value.endsWith('ed')) {
    value = value.slice(0, -2);
    if (/([b-df-hj-np-tv-z])\1$/u.test(value)) value = value.slice(0, -1);
  } else if (value.length > 5 && value.endsWith('ly')) value = value.slice(0, -2);
  else if (value.length > 4 && value.endsWith('s') && !value.endsWith('ss')) value = value.slice(0, -1);
  return value;
}

function searchableTokens(text: string) {
  return phraseTokens(text)
    .map(stemToken)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function hasLanguageText(text: string) {
  return phraseTokens(text).some((token) => token.length > 1 && /\p{L}/u.test(token));
}

function addWeightedText(weights: Map<string, number>, text: string | undefined, weight: number) {
  if (!text) return;
  for (const token of new Set(searchableTokens(text))) {
    weights.set(token, Math.max(weights.get(token) ?? 0, weight));
  }
}

const feelingBySlug = new Map(feelings.map((feeling) => [feeling.slug, feeling]));
const fauxFeelingBySlug = new Map(fauxFeelings.map((feeling) => [feeling.slug, feeling]));
const authoredTextByNeed = new Map<string, string[]>();

function addAuthoredText(needSlug: string, text: string) {
  const entries = authoredTextByNeed.get(needSlug) ?? [];
  entries.push(text);
  authoredTextByNeed.set(needSlug, entries);
}

observationInferenceIndex.expressions.forEach((expression) => {
  const searchText = [
    expression.id.replace(/-/g, ' '),
    ...expression.examples,
    ...expression.cueIds.map((cueId) => cueId.replace(/-/g, ' ')),
  ].join(' ');
  expression.needSlugs.forEach((needSlug) => addAuthoredText(needSlug, searchText));
});

observationInferenceIndex.eventFamilies.forEach((family) => {
  const searchText = [
    family.id.replace(/-/g, ' '),
    family.label,
    family.explanation,
    ...family.patterns.map((pattern) => pattern.id.replace(/-/g, ' ')),
  ].join(' ');
  family.needSlugs.forEach((needSlug) => addAuthoredText(needSlug, searchText));
});

const documents: SearchDocument[] = needs.map((need) => {
  const weights = new Map<string, number>();
  addWeightedText(weights, need.title, 14);
  addWeightedText(weights, need.slug.replace(/-/g, ' '), 12);
  addWeightedText(weights, need.category, 2);
  addWeightedText(weights, need.summary, 6);

  need.fauxFeelings.forEach((reference) => {
    const fauxFeeling = fauxFeelingBySlug.get(reference.slug);
    addWeightedText(weights, fauxFeeling?.title ?? reference.title, 10);
  });
  need.feelings.forEach((reference) => {
    const feeling = feelingBySlug.get(reference.slug);
    addWeightedText(weights, feeling?.title ?? reference.title, 5);
    addWeightedText(weights, feeling?.summary, 2);
    feeling?.bodySignals.forEach((signal) => addWeightedText(weights, signal, 1));
  });
  authoredTextByNeed.get(need.slug)?.forEach((text) => addWeightedText(weights, text, 4));

  return {
    slug: need.slug,
    title: need.title,
    category: need.category ?? '',
    weights,
    breadth: need.feelings.length + (need.fauxFeelings.length * 2) + Math.min(6, Math.floor(weights.size / 12)),
  };
});

const documentFrequency = new Map<string, number>();
documents.forEach((document) => {
  document.weights.forEach((_weight, token) => documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1));
});

function inverseDocumentFrequency(token: string) {
  const frequency = documentFrequency.get(token) ?? 0;
  return Math.log((documents.length + 1) / (frequency + 1)) + 1;
}

const starterDocuments = (() => {
  const sorted = [...documents].sort((left, right) => right.breadth - left.breadth || left.title.localeCompare(right.title));
  const selected: SearchDocument[] = [];
  const categories = new Set<string>();
  for (const document of sorted) {
    if (selected.length >= 12) break;
    if (document.category && categories.has(document.category)) continue;
    selected.push(document);
    if (document.category) categories.add(document.category);
  }
  for (const document of sorted) {
    if (selected.length >= 12) break;
    if (!selected.some((candidate) => candidate.slug === document.slug)) selected.push(document);
  }
  return selected;
})();

export function retrieveNeedCandidates(text: string, limit = 12): NeedRetrievalMatch[] {
  const queryTokens = searchableTokens(text);
  if (!queryTokens.length) return [];
  const queryCounts = new Map<string, number>();
  queryTokens.forEach((token) => queryCounts.set(token, Math.min(3, (queryCounts.get(token) ?? 0) + 1)));
  const normalizedText = normalizeForMatch(text);

  return documents
    .map((document) => {
      let score = 0;
      const matchedTerms: string[] = [];
      queryCounts.forEach((count, token) => {
        const fieldWeight = document.weights.get(token);
        if (!fieldWeight) return;
        score += fieldWeight * inverseDocumentFrequency(token) * (1 + ((count - 1) * 0.2));
        matchedTerms.push(token);
      });
      const normalizedTitle = normalizeForMatch(document.title);
      if (normalizedTitle.length > 2 && normalizedText.includes(normalizedTitle)) score += 28;
      return { slug: document.slug, title: document.title, score, matchedTerms };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, limit);
}

export function starterNeedCandidates(limit = 12): NeedRetrievalMatch[] {
  return starterDocuments.slice(0, limit).map((document, index) => ({
    slug: document.slug,
    title: document.title,
    score: Math.max(1, 12 - index),
    matchedTerms: [],
  }));
}

export function hasSearchableObservationText(text: string) {
  return hasLanguageText(text);
}

export function starterFeelingSlugs(mode: ObservationMode, limit = 16) {
  return [...feelings]
    .filter((feeling) => mode === 'met' ? feeling.needSatisfaction !== 'unmet' : feeling.needSatisfaction !== 'met')
    .sort((left, right) => right.needs.length - left.needs.length || left.title.localeCompare(right.title))
    .slice(0, limit)
    .map((feeling) => feeling.slug);
}
