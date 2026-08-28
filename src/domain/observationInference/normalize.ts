import type { ObservationToken, TextRange } from './types';

const TOKEN_PATTERN = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;
const COMBINING_MARKS = /\p{M}+/gu;
const CLAUSE_BOUNDARY = /[,;.!?\n]+/g;

export function normalizeForMatch(value: string) {
  return value
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(/’/g, "'")
    .toLocaleLowerCase('en-US');
}

export function findQuoteRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  const pairedQuotes: Array<[string, string]> = [['“', '”'], ['"', '"'], ['‘', '’']];

  pairedQuotes.forEach(([opening, closing]) => {
    let searchFrom = 0;
    while (searchFrom < text.length) {
      const start = text.indexOf(opening, searchFrom);
      if (start < 0) break;
      const endIndex = text.indexOf(closing, start + opening.length);
      if (endIndex < 0) break;
      ranges.push({ start, end: endIndex + closing.length });
      searchFrom = endIndex + closing.length;
    }
  });

  let straightStart = -1;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== "'") continue;
    const previous = text[index - 1] ?? '';
    const next = text[index + 1] ?? '';
    const isApostrophe = /[\p{L}\p{N}]/u.test(previous) && /[\p{L}\p{N}]/u.test(next);
    if (isApostrophe) continue;
    if (straightStart < 0) {
      if (next && !/\s/u.test(next)) straightStart = index;
    } else {
      ranges.push({ start: straightStart, end: index + 1 });
      straightStart = -1;
    }
  }

  return ranges
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .filter((range, index, all) => index === 0 || range.start !== all[index - 1]?.start || range.end !== all[index - 1]?.end);
}

export function findClauseRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  let start = 0;
  let match: RegExpExecArray | null;
  CLAUSE_BOUNDARY.lastIndex = 0;
  while ((match = CLAUSE_BOUNDARY.exec(text)) !== null) {
    const end = match.index;
    if (end > start) ranges.push({ start, end });
    start = match.index + match[0].length;
  }
  if (start < text.length) ranges.push({ start, end: text.length });
  return ranges.length ? ranges : [{ start: 0, end: text.length }];
}

export function rangeInside(range: TextRange, containers: TextRange[]) {
  return containers.some((container) => range.start >= container.start && range.end <= container.end);
}

export function rangesOverlap(left: TextRange, right: TextRange) {
  return left.start < right.end && right.start < left.end;
}

export function tokenizeObservation(text: string, quoteRanges = findQuoteRanges(text)) {
  const clauses = findClauseRanges(text);
  const tokens: ObservationToken[] = [];
  TOKEN_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  let clauseIndex = 0;

  while ((match = TOKEN_PATTERN.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    while (clauseIndex < clauses.length - 1 && start >= (clauses[clauseIndex]?.end ?? text.length)) {
      clauseIndex += 1;
    }
    tokens.push({
      start,
      end,
      text: match[0],
      normalized: normalizeForMatch(match[0]),
      clauseIndex,
      quoted: rangeInside({ start, end }, quoteRanges),
    });
  }

  return { tokens, clauses, quoteRanges };
}

export function phraseTokens(value: string) {
  return tokenizeObservation(value, []).tokens.map((token) => token.normalized);
}
