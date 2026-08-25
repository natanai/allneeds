import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps only the four unresolved Support mountain variations', () => {
    expect(needMagnetAuditCandidates.map((candidate) => candidate.id)).toEqual([
      'support-alpine-fade',
      'support-soft-peaks',
      'support-ridgeline',
      'support-distant-range',
    ]);
    expect(needMagnetAuditCandidates.every((candidate) => candidate.needSlug === 'support')).toBe(true);
    expect(needMagnetAuditCandidates.some((candidate) => candidate.id.endsWith('-current'))).toBe(false);
  });

  it('keeps all Support variations in the production icon spacing while hiding the icon', () => {
    needMagnetAuditCandidates.forEach((candidate) => {
      expect(candidate.hideIcon).toBe(true);
      expect(candidate.iconPath).toBe('icons/needs/support.svg');
      expect(candidate.artMaskPath).toMatch(/^design-lab\/need-magnets\/support-/);
    });
  });

  it('keeps every full-face proposal tied to a contrast-bearing Customizer role', () => {
    const contrastRole = /var\(--(?:primary|text|outline)\)/;
    needMagnetAuditCandidates.forEach((candidate) => {
      expect(`${candidate.artA} ${candidate.artB}`).toMatch(contrastRole);
    });
  });
});
