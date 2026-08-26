import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('contains only the focused Safety umbrella and icon review', () => {
    expect(needMagnetAuditCandidates.map(({ id, needSlug, title }) => ({ id, needSlug, title }))).toEqual([
      { id: 'safety-protective-canopy', needSlug: 'safety', title: 'S3a · Protective Canopy' },
      { id: 'safety-aligned-diagonal', needSlug: 'safety', title: 'S3b · Aligned Diagonal' },
      { id: 'safety-layered-cover', needSlug: 'safety', title: 'S3c · Layered Cover' },
      { id: 'safety-long-reach', needSlug: 'safety', title: 'S3d · Long Reach' },
      { id: 'safety-offframe-tilt', needSlug: 'safety', title: 'S3e · Off-frame Tilt' },
      { id: 'safety-aligned-echo', needSlug: 'safety', title: 'S3f · Aligned Echo' },
    ]);
  });

  it('keeps Safety icon exploration out of the generic shield treatment', () => {
    const iconPaths = needMagnetAuditCandidates.map((candidate) => candidate.iconPath);

    expect(iconPaths).not.toContain('icons/needs/safety.svg');
    expect(new Set(iconPaths).size).toBeGreaterThanOrEqual(4);
    for (const iconPath of iconPaths) {
      expect(iconPath).toMatch(/^design-lab\/need-magnets\/icon-.+\.svg$/);
    }
  });

  it('uses full-face audit masks and functional Customizer roles', () => {
    for (const candidate of needMagnetAuditCandidates) {
      expect(candidate.hideIcon).not.toBe(true);
      expect(candidate.artMaskPath).toMatch(/^design-lab\/need-magnets\/safety-.+\.svg$/);

      for (const value of [
        candidate.faceBackground,
        candidate.iconFill,
        candidate.artA,
        candidate.artB,
      ]) {
        expect(value).not.toMatch(/--(?:plum|lavender|ink|rose|mint|gold|sky|peach)\b/);
      }
    }
  });
});
