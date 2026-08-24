import { describe, expect, it } from 'vitest';

import {
  JOURNAL_HISTORY_COLLAPSE_AFTER_WORDS,
  JOURNAL_HISTORY_PREVIEW_WORDS,
  journalHistoryNote,
} from './journalHistoryNote';

function words(count: number) {
  return Array.from({ length: count }, (_, index) => `word${index + 1}`).join(' ');
}

describe('Journal History reflection previews', () => {
  it('omits blank reflections and leaves 80-word reflections intact', () => {
    expect(journalHistoryNote('  ')).toBeNull();
    expect(journalHistoryNote(words(JOURNAL_HISTORY_COLLAPSE_AFTER_WORDS))).toEqual({
      full: words(JOURNAL_HISTORY_COLLAPSE_AFTER_WORDS),
      preview: words(JOURNAL_HISTORY_COLLAPSE_AFTER_WORDS),
      collapsible: false,
    });
  });

  it('collapses longer reflections to the exact legacy 55-word preview', () => {
    const full = words(JOURNAL_HISTORY_COLLAPSE_AFTER_WORDS + 1);
    const note = journalHistoryNote(full);
    expect(note).toEqual({
      full,
      preview: `${words(JOURNAL_HISTORY_PREVIEW_WORDS)}…`,
      collapsible: true,
    });
  });
});
