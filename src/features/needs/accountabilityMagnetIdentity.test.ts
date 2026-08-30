import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { needMagnetItem } from '../../components/magnets/catalogMagnetItems';
import { needMagnetAuditCandidates } from '../designLab/needMagnetAuditCandidates';

const css = readFileSync('src/components/magnets/MagnetFaces.css', 'utf8');
const icon = readFileSync('public/icons/needs/accountability.svg', 'utf8');
const art = readFileSync('public/icons/needs/art/accountability-responsibility-mosaic.svg', 'utf8');

describe('approved Accountability magnet identity', () => {
  it('ships Responsibility Mosaic A1 through the canonical Need identity owner', () => {
    const item = needMagnetItem({ slug: 'accountability', title: 'Accountability' });
    expect(css).toContain("data-magnet-id='needs-accountability'");
    expect(item.iconUrl).toContain('icons/needs/accountability.svg');
    expect(css).toContain("mask: url('/icons/needs/art/accountability-responsibility-mosaic.svg')");
    expect(css).toContain('var(--quiet) 72%');
    expect(css).toContain('var(--selection) 76%');
    expect(css).toContain('var(--primary) 82%');
    expect(css).toContain('opacity: 0.34');
  });

  it('uses the approved four-piece icon and full-face mosaic geometry', () => {
    expect(icon.match(/<rect /g)).toHaveLength(4);
    expect(icon).toContain('x="13.2" y="13.2" width="7.6" height="7.6"');
    expect(art).toContain('viewBox="0 0 320 96"');
    expect(art.match(/<rect /g)).toHaveLength(7);
    expect(art).toContain('x="0" y="0" width="86" height="44"');
    expect(art).toContain('x="268" y="18" width="52" height="60"');
  });

  it('keeps the completed Accountability review out of the active Design Lab', () => {
    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'accountability')).toBe(false);
  });
});
