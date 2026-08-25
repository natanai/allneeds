import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('contains only the focused Safety umbrella review', () => {
    expect(needMagnetAuditCandidates.map(({ id, needSlug, title }) => ({ id, needSlug, title }))).toEqual([
      { id: 'safety-protective-canopy', needSlug: 'safety', title: 'S3a · Protective Canopy' },
      { id: 'safety-diagonal-guardian', needSlug: 'safety', title: 'S3b · Diagonal Guardian' },
      { id: 'safety-layered-cover', needSlug: 'safety', title: 'S3c · Layered Cover' },
      { id: 'safety-cropped-sweep', needSlug: 'safety', title: 'S3d · Cropped Sweep' },
      { id: 'safety-side-shield', needSlug: 'safety', title: 'S3e · Side Shield' },
      { id: 'safety-echo-canopy', needSlug: 'safety', title: 'S3f · Echo Canopy' },
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
