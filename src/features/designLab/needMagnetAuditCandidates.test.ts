import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps approved Need identities out of the active review set', () => {
    expect(needMagnetAuditCandidates).toEqual([]);
  });
});
