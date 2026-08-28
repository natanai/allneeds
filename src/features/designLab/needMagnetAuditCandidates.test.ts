import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('removes the approved Accountability candidates from the active review surface', () => {
    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'accountability')).toBe(false);
  });
});
