import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps the active review set limited to Honesty', () => {
    expect(needMagnetAuditCandidates).toHaveLength(4);
    expect(new Set(needMagnetAuditCandidates.map((candidate) => candidate.needSlug))).toEqual(new Set(['honesty']));
    expect(needMagnetAuditCandidates.map((candidate) => candidate.id)).toEqual([
      'honesty-alignment-field',
      'honesty-matched-signal',
      'honesty-revision-path',
      'honesty-impression-overlap',
    ]);
  });

  it('uses one semantic icon and full-face artwork for every Honesty candidate', () => {
    for (const candidate of needMagnetAuditCandidates) {
      expect(candidate.iconPath).toMatch(/honesty-/);
      expect(candidate.secondaryIconPath).toBeUndefined();
      expect(candidate.secondaryIconFill).toBeUndefined();
      expect(candidate.artMaskPath).toMatch(/honesty-/);
      expect(candidate.artOpacity ?? 0).toBeGreaterThan(0);
    }
  });

  it('keeps candidate ids unique', () => {
    const ids = needMagnetAuditCandidates.map((candidate) => candidate.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
