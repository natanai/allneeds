export const JOURNAL_HISTORY_COLLAPSE_AFTER_WORDS = 80;
export const JOURNAL_HISTORY_PREVIEW_WORDS = 55;

export type JournalHistoryNotePresentation = {
  full: string;
  preview: string;
  collapsible: boolean;
};

export function journalHistoryNote(value: string): JournalHistoryNotePresentation | null {
  const full = value.trim();
  if (!full) return null;
  const words = full.split(/\s+/).filter(Boolean);
  if (words.length <= JOURNAL_HISTORY_COLLAPSE_AFTER_WORDS) {
    return { full, preview: full, collapsible: false };
  }
  return {
    full,
    preview: `${words.slice(0, JOURNAL_HISTORY_PREVIEW_WORDS).join(' ')}…`,
    collapsible: true,
  };
}
