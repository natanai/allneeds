import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps one production control and one selected proposal for each audited need', () => {
    expect(needMagnetAuditCandidates.map((candidate) => candidate.id)).toEqual([
      'connection-current',
      'connection-constellation',
      'support-current',
      'support-mountain-range',
    ]);

    for (const slug of ['connection', 'support'] as const) {
      const group = needMagnetAuditCandidates.filter((candidate) => candidate.needSlug === slug);
      expect(group).toHaveLength(2);
      expect(group.filter((candidate) => candidate.id.endsWith('-current'))).toHaveLength(1);
      expect(group.filter((candidate) => candidate.artMaskPath)).toHaveLength(1);
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

  it('keeps Support icon spacing while hiding the icon for the mountain-range proposal', () => {
    const support = needMagnetAuditCandidates.find((candidate) => candidate.id === 'support-mountain-range');
    expect(support?.hideIcon).toBe(true);
    expect(support?.artMaskPath).toBe('design-lab/need-magnets/support-mountain-range.svg');
  });
});
