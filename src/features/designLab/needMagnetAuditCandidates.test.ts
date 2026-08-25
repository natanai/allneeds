import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('contains only unresolved Need magnet reviews', () => {
    expect(needMagnetAuditCandidates).toEqual([]);
  });
});
