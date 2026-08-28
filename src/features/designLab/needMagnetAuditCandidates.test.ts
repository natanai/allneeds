import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('removes approved Honesty candidates from the active review surface', () => {
    expect(needMagnetAuditCandidates).toEqual([]);
  });
});
