import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { needMagnetItem } from '../../components/magnets/catalogMagnetItems';

const faceCss = readFileSync(
  new URL('../../components/magnets/MagnetFaces.css', import.meta.url),
  'utf8',
);
const supportArt = readFileSync(
  new URL('../../../public/icons/needs/art/support-soft-terraces.svg', import.meta.url),
  'utf8',
);

describe('approved Need magnet identities', () => {
  it('ships Connection with the approved Constellation artwork and semantic Customizer roles', () => {
    expect(faceCss).toContain("[data-magnet-id='needs-connection']");
    expect(faceCss).toContain("/icons/needs/art/connection-constellation.svg");
    expect(faceCss).toContain('var(--positive)');
    expect(faceCss).toContain('var(--primary)');
  });

  it('ships Support with the approved Soft Terraces artwork and preserved icon spacing', () => {
    expect(faceCss).toContain("[data-magnet-id='needs-support']");
    expect(faceCss).toContain("/icons/needs/art/support-soft-terraces.svg");
    expect(faceCss).toContain('color-mix(in srgb, var(--selection) 82%, var(--positive) 18%)');
    expect(faceCss).toContain('color-mix(in srgb, var(--primary) 76%, var(--quiet) 24%)');
    expect(faceCss).toMatch(/needs-support'\]::before[\s\S]*?opacity: 0;/);
    expect(supportArt).toContain('preserveAspectRatio="none"');
    expect(supportArt).toContain('viewBox="0 0 220 64"');
  });

  it('ships Understanding with the approved U4D two-lens identity', () => {
    const item = needMagnetItem({ slug: 'understanding', title: 'Understanding' });
    expect(faceCss).toContain("[data-magnet-id='needs-understanding']");
    expect(item.iconUrl).toContain('icons/needs/understanding.svg');
    expect(faceCss).toContain("url('/icons/needs/understanding-perspective.svg')");
    expect(faceCss).toContain("url('/icons/needs/art/understanding-converging-map.svg')");
    expect(faceCss).toContain('color-mix(in srgb, var(--quiet) 62%, var(--selection) 38%)');
    expect(faceCss).toContain('color-mix(in srgb, var(--selection) 66%, var(--action) 34%)');
    expect(faceCss).toContain('background: linear-gradient(110deg, var(--primary), var(--action));');
    expect(faceCss).toContain('opacity: 0.3;');
  });

  it('ships Honesty with the approved Heart to Honesty identity', () => {
    const item = needMagnetItem({ slug: 'honesty', title: 'Honesty' });
    expect(faceCss).toContain("[data-magnet-id='needs-honesty']");
    expect(item.iconUrl).toContain('icons/needs/honesty.svg');
    expect(faceCss).toContain("url('/icons/needs/art/honesty-corrected-destination.svg')");
    expect(faceCss).toContain('color-mix(in srgb, var(--quiet) 82%, var(--selection) 18%)');
    expect(faceCss).toContain('color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%)');
    expect(faceCss).toContain('color-mix(in srgb, var(--primary) 72%, var(--text) 28%)');
    expect(faceCss).toContain('color-mix(in srgb, var(--action) 62%, var(--text) 38%)');
    expect(faceCss).toContain('opacity: 0.29;');
  });

  it('uses only functional Customizer roles in approved Need identity CSS', () => {
    expect(faceCss).not.toMatch(/var\(--(?:plum|lavender|ink|rose|mint|gold|sky|peach)\)/);
  });
});
