import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps the active review set limited to four Clarity C4 variants', () => {
    expect(needMagnetAuditCandidates).toHaveLength(4);
    expect(new Set(needMagnetAuditCandidates.map((candidate) => candidate.needSlug))).toEqual(new Set(['clarity']));
  });

  it('holds the C4 lens icons fixed while varying only relationship artwork', () => {
    for (const candidate of needMagnetAuditCandidates) {
      expect(candidate.iconPath).toBe('/design-lab/need-magnets/clarity-explicit-focus.svg');
      expect(candidate.secondaryIconPath).toBe('/design-lab/need-magnets/clarity-inner-compass.svg');
      expect(candidate.artMaskPath).toMatch(/clarity-/);
      expect(candidate.artOpacity ?? 0).toBeGreaterThan(0);
    }

    expect(new Set(needMagnetAuditCandidates.map((candidate) => candidate.artMaskPath)).size).toBe(4);
  });

  it('keeps candidate ids unique', () => {
    const ids = needMagnetAuditCandidates.map((candidate) => candidate.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
