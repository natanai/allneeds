import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps approved Honesty candidates out while exposing the active Accountability review set', () => {
    const accountabilityCandidates = needMagnetAuditCandidates.filter((candidate) => candidate.needSlug === 'accountability');

    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'honesty')).toBe(false);
    expect(accountabilityCandidates.map((candidate) => candidate.id)).toEqual([
      'accountability-a1-responsibility-mosaic',
      'accountability-a2-ripple-response',
      'accountability-a3-open-account',
      'accountability-a4-repair-seam',
      'accountability-a5-effect-loop',
    ]);
  });

  it('keeps Accountability candidate assets review-only and full-face', () => {
    const accountabilityCandidates = needMagnetAuditCandidates.filter((candidate) => candidate.needSlug === 'accountability');

    for (const candidate of accountabilityCandidates) {
      expect(candidate.iconPath).toMatch(/^\/design-lab\/need-magnets\//);
      expect(candidate.artMaskPath).toMatch(/^\/design-lab\/need-magnets\//);
      expect(candidate.artOpacity ?? 0).toBeGreaterThan(0);
    }
  });
});