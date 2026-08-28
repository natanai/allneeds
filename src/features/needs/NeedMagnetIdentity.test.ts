import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const needsCss = readFileSync(new URL('./NeedsPage.module.css', import.meta.url), 'utf8');
const supportArt = readFileSync(
  new URL('../../../public/icons/needs/art/support-soft-terraces.svg', import.meta.url),
  'utf8',
);

describe('approved Need magnet identities', () => {
  it('ships Connection with the approved Constellation artwork and semantic Customizer roles', () => {
    expect(needsCss).toContain("[data-magnet-id='needs-connection']");
    expect(needsCss).toContain("/icons/needs/art/connection-constellation.svg");
    expect(needsCss).toContain('var(--positive)');
    expect(needsCss).toContain('var(--primary)');
  });

  it('ships Support with the approved Soft Terraces artwork and preserved icon spacing', () => {
    expect(needsCss).toContain("[data-magnet-id='needs-support']");
    expect(needsCss).toContain("/icons/needs/art/support-soft-terraces.svg");
    expect(needsCss).toContain('color-mix(in srgb, var(--selection) 82%, var(--positive) 18%)');
    expect(needsCss).toContain('color-mix(in srgb, var(--primary) 76%, var(--quiet) 24%)');
    expect(needsCss).toMatch(/\[data-magnet-id='needs-support'\]\)::before[\s\S]*?opacity: 0;/);
    expect(supportArt).toContain('preserveAspectRatio="none"');
    expect(supportArt).toContain('viewBox="0 0 220 64"');
  });

  it('ships Understanding with the approved U4D two-lens identity', () => {
    expect(needsCss).toContain("[data-magnet-id='needs-understanding']");
    expect(needsCss).toContain("url('/icons/needs/understanding.svg')");
    expect(needsCss).toContain("url('/icons/needs/understanding-perspective.svg')");
    expect(needsCss).toContain("url('/icons/needs/art/understanding-converging-map.svg')");
    expect(needsCss).toContain('color-mix(in srgb, var(--quiet) 62%, var(--selection) 38%)');
    expect(needsCss).toContain('color-mix(in srgb, var(--selection) 66%, var(--action) 34%)');
    expect(needsCss).toContain('background: linear-gradient(110deg, var(--primary), var(--action));');
    expect(needsCss).toContain('opacity: 0.3;');
  });

  it('ships Honesty with the approved Heart to Honesty identity', () => {
    expect(needsCss).toContain("[data-magnet-id='needs-honesty']");
    expect(needsCss).toContain("url('/icons/needs/honesty.svg')");
    expect(needsCss).toContain("url('/icons/needs/art/honesty-corrected-destination.svg')");
    expect(needsCss).toContain('color-mix(in srgb, var(--quiet) 82%, var(--selection) 18%)');
    expect(needsCss).toContain('color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%)');
    expect(needsCss).toContain('color-mix(in srgb, var(--primary) 72%, var(--text) 28%)');
    expect(needsCss).toContain('color-mix(in srgb, var(--action) 62%, var(--text) 38%)');
    expect(needsCss).toContain('opacity: 0.29;');
  });

  it('uses only functional Customizer roles in approved Need identity CSS', () => {
    expect(needsCss).not.toMatch(/var\(--(?:plum|lavender|ink|rose|mint|gold|sky|peach)\)/);
  });
});
