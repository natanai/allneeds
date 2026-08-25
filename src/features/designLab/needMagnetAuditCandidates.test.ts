import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('contains only the focused Safety canopy review', () => {
    expect(needMagnetAuditCandidates.map(({ id, needSlug, title }) => ({ id, needSlug, title }))).toEqual([
      { id: 'safety-protective-canopy', needSlug: 'safety', title: 'S3a · Protective Canopy' },
      { id: 'safety-shelter-arc', needSlug: 'safety', title: 'S3b · Shelter Arc' },
      { id: 'safety-layered-cover', needSlug: 'safety', title: 'S3c · Layered Cover' },
      { id: 'safety-quiet-understory', needSlug: 'safety', title: 'S3d · Quiet Understory' },
      { id: 'safety-enfolding-field', needSlug: 'safety', title: 'S3e · Enfolding Field' },
    ]);
  });

  it('uses the production Safety icon, full-face audit masks, and functional Customizer roles', () => {
    for (const candidate of needMagnetAuditCandidates) {
      expect(candidate.iconPath).toBe('icons/needs/safety.svg');
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
