import { localProfileRisk, type ProfileComparison } from './profileReconciliation';

export type ProfileAction = 'merge' | 'replace' | null;

type Confirm = (message: string) => boolean;

function list(parts: string[]) {
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

export function requestProfileAction(
  comparison: ProfileComparison,
  deviceLabel: 'browser' | 'home-screen app',
  confirm: Confirm = (message) => window.confirm(message),
): ProfileAction {
  const risk = localProfileRisk(comparison);
  const parts = [
    risk.journalEntries ? `${risk.journalEntries} local journal ${risk.journalEntries === 1 ? 'entry' : 'entries'}` : '',
    risk.strategies ? `${risk.strategies} local saved ${risk.strategies === 1 ? 'strategy' : 'strategies'}` : '',
  ].filter(Boolean);
  const riskyCount = risk.journalEntries + risk.strategies;

  if (!riskyCount) {
    return confirm(
      `Load your saved profile?\n\nYour saved profile will replace data stored in this ${deviceLabel}. Unfinished drafts will stay here.`,
    ) ? 'replace' : null;
  }

  const localEntries = list(parts);
  const merge = confirm(
    `Local entries found\n\nThis ${deviceLabel} contains ${localEntries} not saved in your profile. Loading your saved profile would remove ${riskyCount === 1 ? 'it' : 'them'}.\n\nMerge ${riskyCount === 1 ? 'this local entry' : 'these local entries'} into your profile?`,
  );
  if (merge) return 'merge';

  return confirm(
    `Discard local entries?\n\nDiscard ${riskyCount === 1 ? 'the local entry' : 'the local entries'} and load your saved profile instead? A recovery copy will be created first.\n\nChoose Cancel to leave everything unchanged.`,
  ) ? 'replace' : null;
}
