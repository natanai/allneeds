/**
 * Known production storage keys discovered during the initial V2 audit.
 *
 * These are compatibility inputs only. New V2 features must not write to
 * legacy keys. Import/migration adapters should read and validate them, then
 * persist into V2-owned versioned stores.
 */
export const LEGACY_STORAGE_KEYS = {
  inventory: 'nvcApp.inventory',
  journalCurrent: 'journal:v2',
  journalLegacy: 'nvcApp.journal',
  alexithymiaJournal: 'alexithymiaSupportJournal',
  theme: 'nvcApp.theme',
  navigationSettings: 'nvcApp.navSettings',
  navigationMagnetLayout: 'site-nav',
} as const;
