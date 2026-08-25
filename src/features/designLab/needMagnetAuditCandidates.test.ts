import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('contains only the focused Safety umbrella review', () => {
    expect(needMagnetAuditCandidates.map(({ id, needSlug, title }) => ({ id, needSlug, title }))).toEqual([
      { id: 'safety-protective-canopy', needSlug: 'safety', title: 'S3a · Protective Canopy' },
      { id: 'safety-wide-parasol', needSlug: 'safety', title: 'S3b · Wide Parasol' },
      { id: 'safety-layered-cover', needSlug: 'safety', title: 'S3c · Layered Cover' },
      { id: 'safety-deep-bell', needSlug: 'safety', title: 'S3d · Deep Bell' },
      { id: 'safety-windward-umbrella', needSlug: 'safety', title: 'S3e · Windward Umbrella' },
      { id: 'safety-twin-canopy', needSlug: 'safety', title: 'S3f · Twin Canopy' },
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
