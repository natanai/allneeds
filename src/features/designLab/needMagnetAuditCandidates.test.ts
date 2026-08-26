import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('removes the approved Safety identity from the active review set', () => {
    expect(needMagnetAuditCandidates).toEqual([]);
  });
});
