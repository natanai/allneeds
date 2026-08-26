import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps approved identities out of the active review set', () => {
    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'safety')).toBe(false);
    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'support')).toBe(false);
    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'connection')).toBe(false);
  });

  it('narrows Understanding review to four U4 map-and-perspective variations', () => {
    const understanding = needMagnetAuditCandidates.filter((candidate) => candidate.needSlug === 'understanding');

    expect(understanding).toHaveLength(4);
    understanding.forEach((candidate) => {
      expect(candidate.id).toMatch(/^understanding-u4-/);
      expect(candidate.secondaryIconPath).toBeTruthy();
      expect(candidate.iconPath).toContain('understanding-map');
      expect(candidate.secondaryIconPath).toContain('understanding-people');
      expect(candidate.artMaskPath).toContain('understanding-art-');
      expect(candidate.artOpacity ?? 0).toBeGreaterThan(0);
      expect(candidate.needTitle).toBe('Understanding');
    });
  });
});
