import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps the active review set limited to Clarity', () => {
    expect(needMagnetAuditCandidates).toHaveLength(4);
    expect(new Set(needMagnetAuditCandidates.map((candidate) => candidate.needSlug))).toEqual(new Set(['clarity']));
  });

  it('gives every Clarity candidate two lens icons and relationship artwork', () => {
    for (const candidate of needMagnetAuditCandidates) {
      expect(candidate.secondaryIconPath).toMatch(/clarity-inner-/);
      expect(candidate.artMaskPath).toMatch(/clarity-/);
      expect(candidate.iconPath).toMatch(/clarity-explicit-/);
      expect(candidate.artOpacity ?? 0).toBeGreaterThan(0);
    }
  });

  it('keeps candidate ids unique', () => {
    const ids = needMagnetAuditCandidates.map((candidate) => candidate.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
