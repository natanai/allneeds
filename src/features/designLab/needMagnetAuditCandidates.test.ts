import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps one production control and review candidates for each audited need', () => {
    for (const slug of ['connection', 'support'] as const) {
      const group = needMagnetAuditCandidates.filter((candidate) => candidate.needSlug === slug);
      expect(group.length).toBeGreaterThanOrEqual(4);
      expect(group.filter((candidate) => candidate.id.endsWith('-current'))).toHaveLength(1);
      expect(group.filter((candidate) => candidate.artMaskPath)).not.toHaveLength(0);
    }
  });

  it('keeps candidate artwork in the dedicated design-lab asset directory', () => {
    needMagnetAuditCandidates
      .filter((candidate) => candidate.artMaskPath)
      .forEach((candidate) => {
        expect(candidate.artMaskPath).toMatch(/^design-lab\/need-magnets\//);
        expect(candidate.iconPath).toBe(`icons/needs/${candidate.needSlug}.svg`);
      });
  });

  it('keeps every full-face proposal tied to a contrast-bearing Customizer role', () => {
    const contrastRole = /var\(--(?:primary|text|outline)\)/;
    needMagnetAuditCandidates
      .filter((candidate) => candidate.artMaskPath)
      .forEach((candidate) => {
        expect(`${candidate.artA} ${candidate.artB}`).toMatch(contrastRole);
      });
  });
});
