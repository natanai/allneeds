import { describe, expect, it, vi } from 'vitest';

import type { ProfileComparison } from './profileReconciliation';
import { requestProfileAction } from './profileConfirmation';

function comparison(journalEntries = 0, strategies = 0): ProfileComparison {
  const records = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `local-${index}` }));
  return {
    device: {},
    profile: {},
    journal: { device: [], profile: [], deviceOnly: records(journalEntries) as never[], profileOnly: [], conflicts: [], matching: 0 },
    inventory: { device: [], profile: [], deviceOnly: records(strategies) as never[], profileOnly: [], conflicts: [], matching: 0 },
    settingKeys: journalEntries || strategies ? [] : ['nvcApp.theme'],
  };
}

describe('browser-native profile confirmations', () => {
  it('uses one confirmation for a routine profile replacement', () => {
    const confirm = vi.fn((_message: string) => true);
    expect(requestProfileAction(comparison(), 'browser', confirm)).toBe('replace');
    expect(confirm).toHaveBeenCalledOnce();
    expect(confirm.mock.calls[0]?.[0]).toContain('Load your saved profile?');
    expect(confirm.mock.calls[0]?.[0]).toContain('replace data stored in this browser');
  });

  it('merges local entries after the first confirmation', () => {
    const confirm = vi.fn((_message: string) => true);
    expect(requestProfileAction(comparison(1), 'home-screen app', confirm)).toBe('merge');
    expect(confirm).toHaveBeenCalledOnce();
    expect(confirm.mock.calls[0]?.[0]).toContain('1 local journal entry not saved in your profile');
    expect(confirm.mock.calls[0]?.[0]).toContain('Merge this local entry into your profile?');
  });

  it('offers discard only after merge is declined', () => {
    const confirm = vi.fn((_message: string) => false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    expect(requestProfileAction(comparison(2, 1), 'browser', confirm)).toBe('replace');
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(confirm.mock.calls[1]?.[0]).toContain('Discard local entries?');
    expect(confirm.mock.calls[1]?.[0]).toContain('A recovery copy will be created first.');
  });

  it('changes nothing when both risky-entry confirmations are canceled', () => {
    const confirm = vi.fn((_message: string) => false);
    expect(requestProfileAction(comparison(1), 'browser', confirm)).toBeNull();
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(confirm.mock.calls[1]?.[0]).toContain('Choose Cancel to leave everything unchanged.');
  });
});
