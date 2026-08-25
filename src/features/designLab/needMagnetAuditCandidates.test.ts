import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('contains only the unresolved Safety visual review', () => {
    expect(needMagnetAuditCandidates.map(({ id, needSlug, title }) => ({ id, needSlug, title }))).toEqual([
      { id: 'safety-signal', needSlug: 'safety', title: 'S1 · Safety Signal' },
      { id: 'safety-shelter', needSlug: 'safety', title: 'S2 · Shelter' },
      { id: 'safety-boundary-map', needSlug: 'safety', title: 'S3 · Boundary Map' },
      { id: 'safety-safe-passage', needSlug: 'safety', title: 'S4 · Safe Passage' },
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
