import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps the active review set limited to Honesty', () => {
    expect(needMagnetAuditCandidates).toHaveLength(4);
    expect(new Set(needMagnetAuditCandidates.map((candidate) => candidate.needSlug))).toEqual(new Set(['honesty']));
  });

  it('gives every Honesty candidate two semantic icons and full-face artwork', () => {
    for (const candidate of needMagnetAuditCandidates) {
      expect(candidate.iconPath).toMatch(/honesty-/);
      expect(candidate.secondaryIconPath).toMatch(/honesty-/);
      expect(candidate.artMaskPath).toMatch(/honesty-/);
      expect(candidate.artOpacity ?? 0).toBeGreaterThan(0);
    }
  });

  it('keeps candidate ids unique', () => {
    const ids = needMagnetAuditCandidates.map((candidate) => candidate.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
