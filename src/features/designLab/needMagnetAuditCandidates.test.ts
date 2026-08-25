import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('contains only the unresolved Safety visual review', () => {
    expect(needMagnetAuditCandidates.map(({ id, needSlug, title }) => ({ id, needSlug, title }))).toEqual([
      { id: 'safety-fortress', needSlug: 'safety', title: 'S1 · Fortress' },
      { id: 'safety-sheltered-home', needSlug: 'safety', title: 'S2 · Sheltered Home' },
      { id: 'safety-protective-canopy', needSlug: 'safety', title: 'S3 · Protective Canopy' },
      { id: 'safety-safe-nest', needSlug: 'safety', title: 'S4 · Safe Nest' },
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
