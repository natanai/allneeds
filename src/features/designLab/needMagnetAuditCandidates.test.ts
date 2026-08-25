import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps only unresolved Support mountain variations', () => {
    expect(needMagnetAuditCandidates.map((candidate) => candidate.id)).toEqual([
      'support-alpine-fade',
      'support-alpine-split-ridges',
      'support-soft-peaks',
      'support-soft-terraces',
      'support-ridgeline',
      'support-ridgeline-twin-crest',
      'support-distant-range',
      'support-distant-horizon-fade',
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

  it('stretches every Support mask to the full magnet face without SVG letterboxing', () => {
    needMagnetAuditCandidates.forEach((candidate) => {
      const maskPath = candidate.artMaskPath;
      expect(maskPath).toBeTruthy();
      const source = readFileSync(
        fileURLToPath(new URL(`../../../public/${maskPath}`, import.meta.url)),
        'utf8',
      );
      expect(source).toContain('preserveAspectRatio="none"');
      expect(source).toContain('220 64');
    });
  });
});
